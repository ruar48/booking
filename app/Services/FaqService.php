<?php

namespace App\Services;

use App\Enums\Sport;
use App\Integrations\Meta\MessengerClient;
use App\Models\DateOverride;
use App\Models\Policy;
use App\Models\Resource;
use App\Models\Setting;
use App\Services\Booking\BookingPricer;
use App\Support\BusinessIdentity;
use Illuminate\Support\Carbon;

/**
 * The public FAQ. Anything that depends on how the venue is set up — rates,
 * the payment hold, the convenience fee, opening hours, house rules, contact
 * details — is read live, so an answer can't drift from what the booking
 * system actually does.
 *
 * Each answer: `answer` (paragraphs separated by a blank line), optional
 * `bullets`, and an optional `link` (`href`, or `action: "cookie-settings"`).
 */
class FaqService
{
    /** Friends one Open Play registration can include (OpenPlayJoinController::store). */
    private const MAX_OPEN_PLAY_FRIENDS = 9;

    public function __construct(
        private readonly MessengerClient $messenger,
    ) {}

    /**
     * @return list<array<string, mixed>>
     */
    public function topics(): array
    {
        $business = BusinessIdentity::current();

        /** @var array<string, mixed> $profile */
        $profile = Setting::query()->where('group', 'venue')->where('key', 'profile')->value('value') ?? [];

        return [
            $this->topic('booking', 'Booking a court', 'Reserving a slot, holds and opening hours.', $this->bookingQuestions()),
            $this->topic('payment', 'Rates & payment', 'Prices, paying with QR Ph, fees and receipts.', $this->paymentQuestions()),
            $this->topic('changes', 'Cancellations & refunds', 'What happens if plans change.', $this->changeQuestions()),
            $this->topic('open-play', 'Open Play', 'Joining sessions and registering friends.', $this->openPlayQuestions()),
            $this->topic('venue', 'At the venue', 'Court rules, facilities and how to find us.', $this->venueQuestions($business, $profile)),
            $this->topic('privacy', 'Your account & privacy', 'Your details, your data and your choices.', $this->privacyQuestions($business)),
        ];
    }

    /**
     * @param  list<array<string, mixed>>  $questions
     * @return array<string, mixed>
     */
    private function topic(string $id, string $title, string $description, array $questions): array
    {
        return ['id' => $id, 'title' => $title, 'description' => $description, 'questions' => $questions];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function bookingQuestions(): array
    {
        $holdMinutes = $this->holdMinutes();

        return [
            [
                'id' => 'how-to-book',
                'question' => 'How do I book a court?',
                'answer' => "Choose a court and time on the Book a Court tab of our home page, sign in or create a free account, then pay online with QR Ph.\n\nYour booking is confirmed as soon as your payment goes through, and your e-receipt appears on screen.",
                'link' => ['label' => 'Book a court', 'href' => route('home', [], false).'#explore'],
            ],
            [
                'id' => 'account-needed',
                'question' => 'Do I need an account?',
                'answer' => 'Yes, to book online. An account lets you pay, see your bookings and keep your e-receipts. Signing up is free and needs a verified email address. You can also book in person at the counter, subject to availability.',
            ],
            [
                'id' => 'hold',
                'question' => 'How long is my slot held while I pay?',
                'answer' => $holdMinutes !== null
                    ? "We hold your slot for {$holdMinutes} minutes from the moment you book. If payment isn't completed in that time, the booking is cancelled automatically and the slot is released to other players."
                    : 'Your slot is held while you complete payment. Unpaid bookings may be cancelled and the slot released to other players, so please pay right away.',
            ],
            [
                'id' => 'several-slots',
                'question' => 'Can I book several hours or courts at once?',
                'answer' => 'Yes. Select all the slots you need in one go: they are paid together with a single QR Ph payment.',
            ],
            [
                'id' => 'hours',
                'question' => 'What are your opening hours?',
                'answer' => $this->hoursAnswer(),
            ],
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function paymentQuestions(): array
    {
        return [
            [
                'id' => 'rates',
                'question' => 'How much does a court cost?',
                ...$this->ratesAnswer(),
            ],
            [
                'id' => 'how-to-pay',
                'question' => 'How do I pay?',
                'answer' => "Online with QR Ph. At checkout we show a QR code: scan it with GCash, Maya or any banking app that supports QR Ph, and confirm the amount.\n\nPayments are processed by our payment provider, PayMongo. The page updates by itself once your payment is received.",
            ],
            [
                'id' => 'fee',
                'question' => 'Is there a convenience fee?',
                'answer' => $this->feeAnswer(),
            ],
            [
                'id' => 'receipt',
                'question' => 'Will I get a receipt?',
                'answer' => 'Yes. The moment your payment is confirmed, your e-receipt is printed on screen and you can save it as an image. Show it at the front desk when you arrive — staff can scan its QR code to check it.'
                    .($this->messenger->isConfigured() ? ' If you have connected Messenger, we also message you a link to it there.' : ''),
            ],
            [
                'id' => 'payment-safety',
                'question' => 'Is my payment information safe?',
                'answer' => 'We never see or store your card, bank or e-wallet details: you pay inside your own banking or e-wallet app, and the payment is handled by PayMongo. We only receive the amount, a payment reference and whether it succeeded.',
            ],
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function changeQuestions(): array
    {
        $terms = route('legal.terms', [], false).'#cancellations';

        return [
            [
                'id' => 'cancel-reschedule',
                'question' => 'Can I cancel or reschedule a paid booking?',
                'answer' => "No. Once paid, a booking is final: it can't be cancelled, moved to another date or time, or switched to another court, and payments are non-refundable unless we cancel.\n\nPlease double-check the court, date and time before you pay.",
                'link' => ['label' => 'Cancellation terms', 'href' => $terms],
            ],
            [
                'id' => 'venue-cancels',
                'question' => 'What if the venue has to cancel?',
                'answer' => "If we cancel your booking or can't provide your court — for example because of severe weather, a typhoon signal, a power interruption or an order from the authorities — you get a full refund of what you paid.",
            ],
            [
                'id' => 'paid-twice',
                'question' => 'What if I paid twice by mistake?',
                'answer' => 'If the same booking is paid twice, the extra payment is flagged automatically for a refund. Contact us with your payment reference if you think this happened to you.',
            ],
            [
                'id' => 'late-payment',
                'question' => 'My slot was released while I was paying. What happens to my money?',
                'answer' => 'If your payment arrives after your hold ran out, we restore your booking as long as the slot is still free. If someone else has booked it in the meantime, your payment is flagged and refunded in full.',
            ],
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function openPlayQuestions(): array
    {
        return [
            [
                'id' => 'what-is-open-play',
                'question' => 'What is Open Play?',
                'answer' => 'Scheduled social sessions where you join as an individual player instead of booking a whole court. Most run as paddle stacking: when you arrive, stack your paddle (from the session page or at the counter), and the next players in line take the next free court. After your game you go to the back of the stack. Some sessions run as a tournament bracket instead.',
            ],
            [
                'id' => 'join-open-play',
                'question' => 'How do I join a session?',
                'answer' => 'Open the session from the Open Play tab, register and pay the fee online. Your spot is confirmed once your payment goes through.',
            ],
            [
                'id' => 'register-friends',
                'question' => 'Can I register my friends?',
                'answer' => 'Yes — add up to '.self::MAX_OPEN_PLAY_FRIENDS.' friends to your registration and pay for everyone at once. Only add people who have agreed to it: their names appear on the session roster.',
            ],
            [
                'id' => 'birthdate',
                'question' => 'Why do you ask for my birthdate?',
                'answer' => "Open Play asks for your birthdate so the organizers know each player's age. Age counts as sensitive personal information under the Data Privacy Act, so we only show it to venue staff and never publish it.",
                'link' => ['label' => 'Privacy Notice', 'href' => route('legal.privacy', [], false)],
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $profile
     * @return list<array<string, mixed>>
     */
    private function venueQuestions(BusinessIdentity $business, array $profile): array
    {
        // House rules first, then each sport's own, labelled with the sport.
        $ruleBook = Policy::courtRuleBook();
        $rules = $ruleBook['general'];

        foreach ($ruleBook['sports'] as $sport => $lines) {
            $label = Sport::from($sport)->label();

            foreach ($lines as $line) {
                $rules[] = "{$label}: {$line}";
            }
        }
        $amenities = array_values(array_filter((array) ($profile['amenities'] ?? []), fn (mixed $item): bool => is_string($item) && $item !== ''));
        $offersRentals = collect($amenities)->contains(fn (string $amenity): bool => (bool) preg_match('/rent|equipment|paddle/i', $amenity));

        $questions = [];

        if ($rules !== []) {
            $questions[] = [
                'id' => 'court-rules',
                'question' => 'What are the court rules?',
                'answer' => 'Please follow these house rules so everyone gets a safe, fair game:',
                'bullets' => $rules,
            ];
        }

        if ($offersRentals) {
            $questions[] = [
                'id' => 'rentals',
                'question' => 'Can I rent paddles and balls?',
                'answer' => 'Yes, at the counter. Please return them in the same condition: damage or loss is charged at replacement cost.',
            ];
        }

        if ($amenities !== []) {
            $questions[] = [
                'id' => 'facilities',
                'question' => 'What facilities do you have?',
                'answer' => 'Besides the courts, you will find:',
                'bullets' => $amenities,
            ];
        }

        if ($business->address !== null) {
            $questions[] = [
                'id' => 'location',
                'question' => 'Where are you located?',
                'answer' => $business->address,
                'link' => ['label' => 'Get directions', 'href' => 'https://www.google.com/maps/dir/?api=1&destination='.rawurlencode($this->mapDestination($profile, $business->address))],
            ];
        }

        $contact = collect([
            $business->phone !== null ? "call or text {$business->phone}" : null,
            $business->email !== null ? "email {$business->email}" : null,
        ])->filter()->implode(', or ');

        $questions[] = [
            'id' => 'contact',
            'question' => 'How do I contact you?',
            'answer' => trim(($contact !== '' ? 'You can '.$contact.'. ' : '')
                .($this->messenger->isConfigured() ? 'Or message us on Facebook Messenger with the button at the bottom of the page.' : ''))
                ?: 'Ask us at the front desk — we are happy to help.',
        ];

        if ($this->messenger->isConfigured()) {
            $questions[] = [
                'id' => 'messenger',
                'question' => 'Can I get booking updates on Facebook Messenger?',
                'answer' => 'Yes. Sign in, open Settings → Messenger and tap Connect Messenger, then send our Page any message in the chat that opens. From then on your booking confirmations, reminders and payment receipts also arrive in Messenger, alongside your emails.

You can disconnect at any time from the same page.',
            ];
        }

        return $questions;
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function privacyQuestions(BusinessIdentity $business): array
    {
        return [
            [
                'id' => 'update-or-delete',
                'question' => 'How do I update my details or delete my account?',
                'answer' => "Sign in and open Settings → Profile. You can correct your details there at any time, or delete your account at the bottom of the page.\n\nDeleting your account removes your profile and the booking and payment history linked to it.",
            ],
            [
                'id' => 'data-kept',
                'question' => 'What personal data do you keep, and why?',
                'answer' => 'Only what running your bookings needs: your account details, your bookings and payments, and basic security records. We never sell your data. Our Privacy Notice explains what we collect, why, who we share it with and how long we keep it.',
                'link' => ['label' => 'Read the Privacy Notice', 'href' => route('legal.privacy', [], false)],
            ],
            [
                'id' => 'cookies',
                'question' => 'How do I change my cookie choices?',
                'answer' => 'Use "Cookie settings" at the bottom of any page. You can switch preferences and analytics on or off at any time; the cookies the site needs to work always stay on.',
                'link' => ['label' => 'Cookie settings', 'action' => 'cookie-settings'],
            ],
            [
                'id' => 'privacy-contact',
                'question' => 'Who do I contact about my personal data?',
                'answer' => $business->dpoEmail !== null
                    ? 'Our Data Protection Officer'.($business->dpoName !== null ? ", {$business->dpoName}," : '')." at {$business->dpoEmail}. You can ask to see, correct or delete your data, or object to how we use it."
                    : 'Contact us at the counter or through the details above and ask for our Data Protection Officer. You can ask to see, correct or delete your data, or object to how we use it.',
            ],
        ];
    }

    private function holdMinutes(): ?int
    {
        $minutes = Setting::query()
            ->where('group', 'bookings')
            ->where('key', 'unpaid_cancel_minutes')
            ->value('value');

        return is_numeric($minutes) && (int) $minutes > 0 ? (int) $minutes : null;
    }

    private function hoursAnswer(): string
    {
        $next = DateOverride::query()
            ->where('date', '>=', today()->toDateString())
            ->where('is_closed', false)
            ->whereNotNull('open_time')
            ->whereNotNull('close_time')
            ->orderBy('date')
            ->first();

        $base = 'Our hours are set day by day, so check the schedule on the Book a Court tab: times you can book are shown there, and closed days are marked.';

        if ($next === null) {
            return $base;
        }

        $date = Carbon::parse($next->date);
        $open = Carbon::parse($date->toDateString().' '.$next->open_time)->format('g:i A');
        $close = Carbon::parse($date->toDateString().' '.$next->close_time)->format('g:i A');
        $day = $date->isToday() ? 'Today' : $date->format('l, F j');

        return "{$base}\n\n{$day}: open {$open} – {$close}.";
    }

    /**
     * @return array{answer: string, bullets?: array<int, string>}
     */
    private function ratesAnswer(): array
    {
        $eveningFrom = Carbon::parse(BookingPricer::EVENING_STARTS)->format('g A');

        $rates = Resource::query()
            ->orderBy('resource_number')
            ->get(['name', 'hourly_rate', 'evening_rate'])
            ->map(fn (Resource $resource): string => $resource->evening_rate !== null && (float) $resource->evening_rate !== (float) $resource->hourly_rate
                ? "{$resource->name}: {$this->peso((float) $resource->hourly_rate)}/hour, {$this->peso((float) $resource->evening_rate)}/hour from {$eveningFrom}"
                : "{$resource->name}: {$this->peso((float) $resource->hourly_rate)}/hour")
            ->values()
            ->all();

        if ($rates === []) {
            return ['answer' => 'Rates are per hour and shown on the schedule before you book.'];
        }

        return [
            'answer' => 'Rates are per hour and shown on the schedule before you book. A booking that crosses into the evening is charged at each rate for the time in it.',
            'bullets' => $rates,
        ];
    }

    private function feeAnswer(): string
    {
        $percent = (float) config('services.paymongo.fee_percent', 0);
        $fixed = (float) config('services.paymongo.fee_fixed', 0);

        if ($percent <= 0 && $fixed <= 0) {
            return 'No. You pay exactly the court rate.';
        }

        $parts = collect([
            $percent > 0 ? rtrim(rtrim(number_format($percent, 2), '0'), '.').'%' : null,
            $fixed > 0 ? $this->peso($fixed) : null,
        ])->filter()->implode(' + ');

        return "Yes. Online payments include a convenience fee of about {$parts} of the booking amount, which covers what our payment provider charges. It's shown as a separate line, with the total, before you pay.";
    }

    /**
     * @param  array<string, mixed>  $profile
     */
    private function mapDestination(array $profile, string $address): string
    {
        $lat = trim((string) ($profile['latitude'] ?? ''));
        $lng = trim((string) ($profile['longitude'] ?? ''));

        return $lat !== '' && $lng !== '' ? "{$lat},{$lng}" : $address;
    }

    private function peso(float $amount): string
    {
        return '₱'.number_format($amount, fmod($amount, 1.0) === 0.0 ? 0 : 2);
    }
}
