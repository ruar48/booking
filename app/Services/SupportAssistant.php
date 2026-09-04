<?php

namespace App\Services;

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Models\DateOverride;
use App\Models\OpenPlaySession;
use App\Models\Policy;
use App\Models\Resource;
use App\Models\ResourceBooking;
use App\Models\Setting;
use App\Models\User;
use App\Repositories\ResourceBookingRepository;
use Illuminate\Support\Carbon;

/**
 * Answers support questions from the app's own data, with no AI service and no
 * API key.
 *
 * The venue's support questions are narrow and predictable, so the question is
 * matched to an intent by keyword and answered from live database records. Every
 * personal answer is scoped to the User resolved from the server session — never
 * from anything the browser sends — so one member cannot read another's bookings.
 * Anything unrecognised falls through to the venue's own contact details rather
 * than being guessed at.
 */
class SupportAssistant
{
    /**
     * Keyword sets per intent. Matching is scored by keyword length so that a
     * specific phrase ("open play") beats an incidental short word ("play").
     *
     * @var array<string, list<string>>
     */
    private const INTENTS = [
        'reschedule' => ['reschedule', 'resched', 'move my booking', 'change the date', 'change my booking', 'change the time', 'move it', 'different day'],
        'cancel' => ['cancel', 'refund my', 'get my money back'],
        'next_booking' => ['next booking', 'my booking', 'my bookings', 'my reservation', 'upcoming booking', 'do i have a booking', 'when is my', 'when am i'],
        'payment' => ['unpaid', 'how do i pay', 'payment', 'pay for', 'qr ph', 'qrph', 'gcash', 'not paid', 'still owe'],
        'availability' => ['available', 'availability', 'free slot', 'open slot', 'any slots', 'is it free', 'can i book', 'vacant', 'what times'],
        'rates' => ['rate', 'rates', 'price', 'prices', 'pricing', 'how much', 'cost', 'fee', 'per hour'],
        'hours' => ['what time do you open', 'opening hours', 'closing time', 'what time do you close', 'hours', 'open today', 'are you open'],
        'open_play' => ['open play', 'session', 'sessions', 'tournament', 'ladder', 'doubles'],
        'policies' => ['policy', 'policies', 'rules', 'terms', 'refund policy'],
        'courts' => ['what courts', 'how many courts', 'facilities', 'amenities', 'billiards', 'what do you have'],
        'contact' => ['where are you', 'address', 'location', 'contact', 'phone number', 'email', 'directions', 'how do i reach'],
        'greeting' => ['hello', 'hi ', 'hey', 'good morning', 'good afternoon', 'good evening'],
        'thanks' => ['thank', 'thanks', 'salamat', 'appreciate'],
    ];

    /**
     * @return array{message: string, suggestions: list<string>}
     */
    public function reply(array $history, ?User $user): array
    {
        $question = $this->latestUserMessage($history);
        $intent = $question === '' ? null : $this->detectIntent($question);

        $message = match ($intent) {
            'reschedule' => $this->answerReschedule($user),
            'cancel' => $this->answerCancel(),
            'next_booking' => $this->answerNextBooking($user),
            'payment' => $this->answerPayment($user),
            'availability' => $this->answerAvailability($question),
            'rates' => $this->answerRates(),
            'hours' => $this->answerHours(),
            'open_play' => $this->answerOpenPlay(),
            'policies' => $this->answerPolicies(),
            'courts' => $this->answerCourts(),
            'contact' => $this->answerContact(),
            'greeting' => "Hi! I can help with your bookings, court availability, rates, opening hours and venue policies. What would you like to know?",
            'thanks' => "You're welcome! Anything else I can help with?",
            default => $this->fallback(),
        };

        return [
            'message' => $message,
            'suggestions' => $this->suggestionsFor($intent, $user),
        ];
    }

    /**
     * Follow-up chips shown after each answer. They stay on screen permanently
     * so there is always a next question available, and they exclude whatever
     * was just asked so the same chip isn't offered twice in a row.
     *
     * @return list<string>
     */
    private function suggestionsFor(?string $intent, ?User $user): array
    {
        $signedIn = $user !== null;
        $mine = "When's my next booking?";

        $chips = match ($intent) {
            'next_booking' => ['How do I reschedule?', 'How do I pay?', 'What are your rates?'],
            'reschedule' => [$mine, 'Can I cancel instead?', "What's available tomorrow?"],
            'cancel' => ['How do I reschedule?', $mine, 'Where are you located?'],
            'payment' => [$mine, 'What is your refund policy?', 'What are your rates?'],
            'availability' => ['What are your rates?', 'What time do you open?', 'What courts do you have?'],
            'rates' => ["What's available tomorrow?", 'What time do you open?', 'What courts do you have?'],
            'hours' => ["What's available tomorrow?", 'What are your rates?', 'Where are you located?'],
            'open_play' => ["What's available tomorrow?", 'What are your rates?', 'What time do you open?'],
            'policies' => ['How do I reschedule?', 'How do I pay?', 'Where are you located?'],
            'courts' => ['What are your rates?', "What's available tomorrow?", 'What time do you open?'],
            'contact' => ['What time do you open?', "What's available tomorrow?", 'What are your rates?'],
            default => [$mine, 'How do I reschedule?', "What's available tomorrow?", 'What are your rates?'],
        };

        // Personal lookups are pointless for a signed-out visitor.
        if (! $signedIn) {
            $chips = array_values(array_filter(
                $chips,
                fn (string $chip) => ! str_contains($chip, 'my next booking'),
            ));

            if ($chips === []) {
                $chips = ['What are your rates?', "What's available tomorrow?", 'What time do you open?'];
            }
        }

        return $chips;
    }

    private function latestUserMessage(array $history): string
    {
        foreach (array_reverse($history) as $entry) {
            if (($entry['role'] ?? null) === 'user') {
                return strtolower(trim((string) ($entry['content'] ?? '')));
            }
        }

        return '';
    }

    /**
     * Intents naming an action the member wants to take. Without this weight,
     * "can I cancel my booking?" scores higher on the incidental phrase
     * "my booking" than on "cancel" and gets answered as a booking lookup.
     *
     * @var array<string, int>
     */
    private const INTENT_WEIGHTS = [
        'reschedule' => 3,
        'cancel' => 3,
        'payment' => 2,
    ];

    private function detectIntent(string $question): ?string
    {
        $best = null;
        $bestScore = 0;

        foreach (self::INTENTS as $intent => $keywords) {
            $score = 0;

            foreach ($keywords as $keyword) {
                if (str_contains($question, $keyword)) {
                    // Longer keywords are more specific, so they outweigh
                    // short incidental matches.
                    $score += strlen($keyword);
                }
            }

            $score *= self::INTENT_WEIGHTS[$intent] ?? 1;

            if ($score > $bestScore) {
                $bestScore = $score;
                $best = $intent;
            }
        }

        return $best;
    }

    // ---------------------------------------------------------------- answers

    private function answerNextBooking(?User $user): string
    {
        if ($user === null) {
            return $this->loginPrompt();
        }

        $booking = ResourceBooking::query()
            ->where('user_id', $user->id)
            ->where('starts_at', '>=', now())
            ->whereIn('status', [BookingStatus::Pending, BookingStatus::Approved])
            ->with('resource:id,name')
            ->orderBy('starts_at')
            ->first();

        if ($booking === null) {
            return "You don't have any upcoming bookings right now. You can reserve a court from the \"Book a court\" page.";
        }

        $lines = [
            'Your next booking is '.($booking->resource?->name ?? 'a court').' on '
                .$booking->starts_at->format('M j, Y').', '
                .$booking->starts_at->format('g:i A').' – '.$booking->ends_at->format('g:i A').'.',
            'Status: '.ucfirst($booking->status->value).', '.ucfirst($booking->payment_status->value)
                .' ('.$this->money($booking->amount).').',
        ];

        if ($user->can('reschedule', $booking)) {
            $lines[] = 'You can still reschedule it until '
                .$booking->starts_at->copy()->subDays(2)->format('M j, Y \a\t g:i A').'.';
        }

        if ($booking->payment_status === PaymentStatus::Unpaid) {
            $lines[] = 'It still needs payment — open the booking and tap "Pay now".';
        }

        return implode(' ', $lines);
    }

    private function answerReschedule(?User $user): string
    {
        $intro = 'You can reschedule a booking yourself up to 2 days before its start time, and once per booking. '
            .'Open the booking from "My bookings" and tap "Reschedule", then pick a new slot. '
            .'After that 2-day cutoff the slot is locked and you\'ll need to contact the venue.';

        if ($user === null) {
            return $intro;
        }

        $reschedulable = ResourceBooking::query()
            ->where('user_id', $user->id)
            ->where('starts_at', '>=', now())
            ->whereIn('status', [BookingStatus::Pending, BookingStatus::Approved])
            ->with('resource:id,name')
            ->orderBy('starts_at')
            ->get()
            ->filter(fn (ResourceBooking $b) => $user->can('reschedule', $b));

        if ($reschedulable->isEmpty()) {
            return $intro.' Right now none of your bookings are still within that window.';
        }

        $list = $reschedulable
            ->map(fn (ResourceBooking $b) => ($b->resource?->name ?? 'Court').' on '
                .$b->starts_at->format('M j').' (until '
                .$b->starts_at->copy()->subDays(2)->format('M j').')')
            ->implode('; ');

        return $intro.' You can currently reschedule: '.$list.'.';
    }

    private function answerCancel(): string
    {
        return 'Members can\'t cancel a booking directly — you can reschedule it instead, up to 2 days before the start time. '
            .'If you really need it cancelled, contact the venue'.$this->contactSuffix().' and a staff member can do it for you.';
    }

    private function answerPayment(?User $user): string
    {
        $minutes = Setting::query()
            ->where('group', 'bookings')
            ->where('key', 'unpaid_cancel_minutes')
            ->value('value');

        $answer = 'Bookings are paid online with QR Ph at checkout — open the booking and tap "Pay now".';

        if ($minutes) {
            $answer .= ' Unpaid bookings are automatically cancelled after '.(int) $minutes.' minutes, so the slot is released.';
        }

        if ($user === null) {
            return $answer;
        }

        $unpaid = ResourceBooking::query()
            ->where('user_id', $user->id)
            ->where('payment_status', PaymentStatus::Unpaid)
            ->whereIn('status', [BookingStatus::Pending, BookingStatus::Approved])
            ->with('resource:id,name')
            ->orderBy('starts_at')
            ->get();

        if ($unpaid->isEmpty()) {
            return $answer.' You have no unpaid bookings.';
        }

        $total = $this->money((string) $unpaid->sum('amount'));
        $list = $unpaid
            ->map(fn (ResourceBooking $b) => ($b->resource?->name ?? 'Court').' on '.$b->starts_at->format('M j'))
            ->implode('; ');

        return $answer.' You currently have '.$unpaid->count().' unpaid booking'
            .($unpaid->count() === 1 ? '' : 's').' totalling '.$total.': '.$list.'.';
    }

    private function answerAvailability(string $question): string
    {
        $date = $this->parseDate($question);

        if ($date === null) {
            return 'Tell me which day you\'re interested in (for example "is anything free on Friday?" or "availability on Sep 8") and I\'ll check the open slots.';
        }

        $override = DateOverride::query()->whereDate('date', $date->toDateString())->first();

        // Dates are closed unless an admin has explicitly opened them.
        if ($override === null || $override->is_closed) {
            return 'The venue isn\'t open for bookings on '.$date->format('M j, Y').'.'
                .($override?->reason ? ' Reason: '.$override->reason.'.' : '');
        }

        $blocked = ResourceBooking::query()
            ->whereDate('starts_at', $date->toDateString())
            ->whereIn('status', ResourceBookingRepository::BLOCKING_STATUSES)
            ->get(['resource_id', 'starts_at', 'ends_at']);

        $open = Carbon::parse($date->toDateString().' '.$override->open_time);
        $close = Carbon::parse($date->toDateString().' '.$override->close_time);

        $summaries = [];

        foreach (Resource::query()->orderBy('resource_number')->get(['id', 'name']) as $court) {
            $slots = [];

            for ($slot = $open->copy(); $slot->copy()->addHour()->lte($close); $slot->addHour()) {
                $slotEnd = $slot->copy()->addHour();

                $taken = $blocked->contains(
                    fn ($b) => $b->resource_id === $court->id
                        && $b->starts_at->lt($slotEnd)
                        && $b->ends_at->gt($slot),
                );

                if (! $taken && $slot->isFuture()) {
                    $slots[] = $slot->format('g A');
                }
            }

            if ($slots !== []) {
                // Long lists are unreadable in a chat bubble.
                $shown = array_slice($slots, 0, 6);
                $more = count($slots) - count($shown);

                $summaries[] = $court->name.': '.implode(', ', $shown)
                    .($more > 0 ? " (+{$more} more)" : '');
            }
        }

        if ($summaries === []) {
            return 'Everything is booked on '.$date->format('M j, Y').'. Try another day.';
        }

        return 'Open slots on '.$date->format('M j, Y').' — '.implode('. ', $summaries)
            .'. Head to "Book a court" to reserve one.';
    }

    private function answerRates(): string
    {
        $bySport = Resource::query()
            ->orderBy('resource_number')
            ->get(['name', 'sport', 'hourly_rate'])
            ->groupBy('sport');

        if ($bySport->isEmpty()) {
            return 'Court rates aren\'t listed yet — please contact the venue'.$this->contactSuffix().'.';
        }

        $parts = $bySport->map(function ($courts, $sport) {
            $rates = $courts->pluck('hourly_rate')->unique();

            $label = ucfirst((string) $sport).' '.(strtolower((string) $sport) === 'billiards' ? 'tables' : 'courts');

            return $rates->count() === 1
                ? $label.' are '.$this->money((string) $rates->first()).' per hour'
                : $label.' range from '.$this->money((string) $rates->min()).' to '.$this->money((string) $rates->max()).' per hour';
        })->values()->implode('. ');

        return $parts.'. Bookings are charged per hour.';
    }

    private function answerHours(): string
    {
        $upcoming = DateOverride::query()
            ->whereDate('date', '>=', now()->toDateString())
            ->where('is_closed', false)
            ->orderBy('date')
            ->limit(5)
            ->get();

        if ($upcoming->isEmpty()) {
            return 'There are no open dates scheduled at the moment. Please check back or contact the venue'.$this->contactSuffix().'.';
        }

        $today = $upcoming->first(fn (DateOverride $d) => Carbon::parse($d->date)->isToday());

        if ($today !== null) {
            return 'We\'re open today from '.$this->time($today->open_time).' to '.$this->time($today->close_time).'.';
        }

        $next = $upcoming->first();

        return 'We\'re not open today. The next open day is '
            .Carbon::parse($next->date)->format('M j, Y').', '
            .$this->time($next->open_time).' to '.$this->time($next->close_time).'.';
    }

    private function answerOpenPlay(): string
    {
        $sessions = OpenPlaySession::query()
            ->where('starts_at', '>=', now())
            ->withCount('registrations')
            ->orderBy('starts_at')
            ->limit(3)
            ->get();

        if ($sessions->isEmpty()) {
            return 'There are no upcoming open play sessions scheduled right now.';
        }

        $list = $sessions->map(function (OpenPlaySession $s) {
            $line = $s->title.' on '.$s->starts_at->format('M j').' at '.$s->starts_at->format('g:i A');

            if ($s->price_per_player !== null) {
                $line .= ', '.$this->money((string) $s->price_per_player).' per player';
            }

            if ($s->max_players) {
                $line .= ' ('.$s->registrations_count.'/'.$s->max_players.' joined)';
            }

            return $line;
        })->implode('. ');

        return 'Upcoming open play: '.$list.'. You can join from the "Open play" page.';
    }

    private function answerPolicies(): string
    {
        $policies = Policy::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get(['title', 'body']);

        if ($policies->isEmpty()) {
            return 'No policies are published yet. Please contact the venue'.$this->contactSuffix().'.';
        }

        return $policies
            ->map(fn (Policy $p) => $p->title.': '.trim(preg_replace('/\s+/', ' ', strip_tags((string) $p->body)) ?? ''))
            ->implode(' — ');
    }

    private function answerCourts(): string
    {
        $courts = Resource::query()->orderBy('resource_number')->get(['name', 'sport', 'status']);

        if ($courts->isEmpty()) {
            return 'Court information isn\'t available right now.';
        }

        $list = $courts->map(function (Resource $r) {
            $status = $r->status instanceof \BackedEnum ? $r->status->value : (string) $r->status;

            return $r->name.($status !== 'available' ? ' ('.$status.')' : '');
        })->implode(', ');

        return 'We have '.$courts->count().': '.$list.'.';
    }

    private function answerContact(): string
    {
        $venue = $this->venue();

        $address = collect([
            $venue['address_line_1'] ?? null,
            $venue['city'] ?? null,
            $venue['state'] ?? null,
            $venue['postal_code'] ?? null,
        ])->filter()->implode(', ');

        $parts = [];

        if ($address !== '') {
            $parts[] = 'We\'re at '.$address.'.';
        }

        if (! empty($venue['phone'])) {
            $parts[] = 'Phone: '.$venue['phone'].'.';
        }

        if (! empty($venue['email'])) {
            $parts[] = 'Email: '.$venue['email'].'.';
        }

        return $parts === []
            ? 'Contact details aren\'t published yet.'
            : implode(' ', $parts);
    }

    private function fallback(): string
    {
        return 'I\'m not sure about that one. I can help with your bookings, rescheduling, court availability, rates, opening hours and policies. '
            .'For anything else, please contact the venue'.$this->contactSuffix().'.';
    }

    private function loginPrompt(): string
    {
        return 'Please log in first and I\'ll be able to look up your bookings.';
    }

    // ---------------------------------------------------------------- helpers

    /**
     * Resolve a date from natural phrasing: "today", "tomorrow", a weekday name,
     * or anything Carbon can read ("Sep 8", "2026-09-08").
     */
    private function parseDate(string $question): ?Carbon
    {
        // Built via Carbon::* rather than now()->addDay() so the result is
        // always a mutable instance — the availability loop below advances the
        // cursor in place, which silently never terminates on an immutable one.
        if (str_contains($question, 'today') || str_contains($question, 'tonight')) {
            return Carbon::today();
        }

        if (str_contains($question, 'tomorrow')) {
            return Carbon::tomorrow();
        }

        foreach (['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as $day) {
            if (str_contains($question, $day)) {
                return Carbon::parse('next '.$day)->startOfDay();
            }
        }

        // A bare month/day or ISO date anywhere in the sentence.
        if (preg_match('/\b(\d{4}-\d{2}-\d{2})\b/', $question, $m)
            || preg_match('/\b((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2})\b/i', $question, $m)) {
            try {
                return Carbon::parse($m[1])->startOfDay();
            } catch (\Throwable) {
                return null;
            }
        }

        return null;
    }

    /**
     * @return array<string, mixed>
     */
    private function venue(): array
    {
        return Setting::query()
            ->where('group', 'venue')
            ->where('key', 'profile')
            ->value('value') ?? [];
    }

    private function contactSuffix(): string
    {
        $venue = $this->venue();

        if (! empty($venue['email'])) {
            return ' at '.$venue['email'];
        }

        if (! empty($venue['phone'])) {
            return ' at '.$venue['phone'];
        }

        return '';
    }

    private function money(string|float|null $amount): string
    {
        return '₱'.number_format((float) $amount, 2);
    }

    private function time(?string $value): string
    {
        return $value ? Carbon::parse($value)->format('g:i A') : '—';
    }
}
