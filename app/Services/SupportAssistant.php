<?php

namespace App\Services;

use Anthropic\Client;
use Anthropic\Messages\ToolUseBlock;
use App\Enums\BookingStatus;
use App\Models\DateOverride;
use App\Models\OpenPlaySession;
use App\Models\Policy;
use App\Models\Resource;
use App\Models\ResourceBooking;
use App\Models\Setting;
use App\Models\User;
use App\Repositories\ResourceBookingRepository;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * Answers support questions about this venue by letting Claude call read-only
 * tools against the app's own data.
 *
 * The retrieval here is tool-based rather than embedding-based on purpose: the
 * data is structured and changes constantly (bookings, availability), and every
 * personal answer has to be scoped to the signed-in user. Tools take the User
 * from the server session — never from anything the model or the browser sends —
 * so the model cannot reach another member's records by asking for them.
 */
class SupportAssistant
{
    /** Turns of prior conversation to replay; keeps request size bounded. */
    private const MAX_HISTORY = 12;

    private const MAX_TOOL_ITERATIONS = 6;

    public function reply(array $history, ?User $user): string
    {
        $client = new Client(apiKey: (string) config('services.anthropic.key'));
        $model = (string) config('services.anthropic.model');

        $tools = $this->toolDefinitions($user !== null);
        $messages = $this->normalizeHistory($history);

        $response = $client->messages->create(
            model: $model,
            maxTokens: 4096,
            // Effort is the cost/latency lever here — support answers are short
            // lookups, not hard reasoning. Thinking stays on (the Opus 5
            // default); disabling it risks tool calls being written as plain
            // text instead of tool_use blocks.
            outputConfig: ['effort' => 'low'],
            system: [
                [
                    'type' => 'text',
                    'text' => $this->systemPrompt($user),
                    'cacheControl' => ['type' => 'ephemeral'],
                ],
            ],
            tools: $tools,
            messages: $messages,
        );

        $iterations = 0;

        while ($response->stopReason === 'tool_use') {
            if (++$iterations > self::MAX_TOOL_ITERATIONS) {
                Log::warning('support.assistant.tool_loop_exhausted');
                break;
            }

            $toolResults = [];

            foreach ($response->content as $block) {
                if (! $block instanceof ToolUseBlock) {
                    continue;
                }

                $toolResults[] = [
                    'type' => 'tool_result',
                    'toolUseID' => $block->id,
                    'content' => $this->runTool($block->name, $block->input, $user),
                ];
            }

            $messages[] = ['role' => 'assistant', 'content' => $response->content];
            $messages[] = ['role' => 'user', 'content' => $toolResults];

            $response = $client->messages->create(
                model: $model,
                maxTokens: 4096,
                outputConfig: ['effort' => 'low'],
                system: [
                    [
                        'type' => 'text',
                        'text' => $this->systemPrompt($user),
                        'cacheControl' => ['type' => 'ephemeral'],
                    ],
                ],
                tools: $tools,
                messages: $messages,
            );
        }

        if ($response->stopReason === 'refusal') {
            return __('Sorry, I can\'t help with that one. Please reach out to the venue directly and a staff member will follow up.');
        }

        $text = '';

        foreach ($response->content as $block) {
            if ($block->type === 'text') {
                $text .= $block->text;
            }
        }

        return trim($text) !== ''
            ? trim($text)
            : __('Sorry, I didn\'t catch that. Could you rephrase your question?');
    }

    /**
     * @param  array<int, array<string, mixed>>  $history
     * @return array<int, array<string, string>>
     */
    private function normalizeHistory(array $history): array
    {
        $messages = [];

        foreach (array_slice($history, -self::MAX_HISTORY) as $entry) {
            $role = ($entry['role'] ?? null) === 'assistant' ? 'assistant' : 'user';
            $content = trim((string) ($entry['content'] ?? ''));

            if ($content === '') {
                continue;
            }

            $messages[] = ['role' => $role, 'content' => $content];
        }

        // The API requires the conversation to open on a user turn.
        while ($messages !== [] && $messages[0]['role'] !== 'user') {
            array_shift($messages);
        }

        if ($messages === []) {
            throw new RuntimeException('No usable conversation history.');
        }

        return $messages;
    }

    private function systemPrompt(?User $user): string
    {
        $venue = Setting::query()
            ->where('group', 'venue')
            ->where('key', 'profile')
            ->value('value') ?? [];

        $paymentWindow = Setting::query()
            ->where('group', 'bookings')
            ->where('key', 'unpaid_cancel_minutes')
            ->value('value');

        $lines = [
            'You are the support assistant for '.config('app.name').', a pickleball venue booking app.',
            'Answer questions from members and visitors about their bookings, court availability, open play sessions, pricing, and venue policies.',
            '',
            '## Ground rules',
            '- Use the provided tools to look up real data before answering anything factual. Never invent booking times, prices, or availability.',
            '- If the tools do not contain the answer, say so plainly and suggest contacting the venue. Do not guess.',
            '- Keep replies short and conversational — two or three sentences is usually right. Use plain text, not markdown tables.',
            '- Format dates like "Sep 8, 2026" and times like "10:00 AM".',
            '- You cannot make, change, cancel, or pay for bookings. When a member wants to act, point them to the right screen instead.',
            '',
            '## How this venue works',
            '- Members book courts by the hour. A date is only bookable if an admin has opened it; otherwise it is closed.',
            '- After booking, payment is made via QR Ph at checkout.'.($paymentWindow ? ' Unpaid bookings are automatically cancelled after '.(int) $paymentWindow.' minutes.' : ''),
            '- Members CANNOT cancel a booking themselves. They can RESCHEDULE it, from the booking\'s detail page.',
            '- Rescheduling is allowed only up to 2 days before the booking start time, and only once per booking. After that the slot is locked and they must contact the venue.',
            '- Only venue staff can cancel a booking.',
        ];

        if ($venue !== []) {
            $lines[] = '';
            $lines[] = '## Venue details';

            foreach (['address_line_1' => 'Address', 'city' => 'City', 'state' => 'Province', 'phone' => 'Phone', 'email' => 'Email'] as $key => $label) {
                if (! empty($venue[$key])) {
                    $lines[] = "- {$label}: {$venue[$key]}";
                }
            }
        }

        $lines[] = '';

        if ($user !== null) {
            $lines[] = 'The person you are talking to is signed in as '.$user->name.'. The booking tools automatically return only their own bookings.';
        } else {
            $lines[] = 'The person you are talking to is NOT signed in, so you cannot look up personal bookings. If they ask about their own bookings, ask them to log in first.';
        }

        return implode("\n", $lines);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function toolDefinitions(bool $isAuthenticated): array
    {
        $tools = [
            [
                'name' => 'get_courts_and_rates',
                'description' => 'List every court/table at the venue with its sport, hourly rate, and current status. Use for pricing questions and "what courts do you have".',
                'inputSchema' => ['type' => 'object', 'properties' => (object) [], 'required' => []],
            ],
            [
                'name' => 'get_availability',
                'description' => 'Check which hourly time slots are still open on a given date, and whether the venue is open that day at all. Use for "is X free on Y" and "when can I book".',
                'inputSchema' => [
                    'type' => 'object',
                    'properties' => [
                        'date' => ['type' => 'string', 'description' => 'Date in YYYY-MM-DD format.'],
                    ],
                    'required' => ['date'],
                ],
            ],
            [
                'name' => 'get_open_play_sessions',
                'description' => 'List upcoming open play sessions with their date, time, price per player, and how many players have registered.',
                'inputSchema' => ['type' => 'object', 'properties' => (object) [], 'required' => []],
            ],
            [
                'name' => 'get_policies',
                'description' => 'Return the venue\'s published policies (booking, payment, refund, house rules). Use for any policy or rules question.',
                'inputSchema' => ['type' => 'object', 'properties' => (object) [], 'required' => []],
            ],
        ];

        if ($isAuthenticated) {
            $tools[] = [
                'name' => 'get_my_bookings',
                'description' => "Look up the signed-in member's own bookings, including status, payment status, amount, and whether each one can still be rescheduled. Use for any question about \"my booking\".",
                'inputSchema' => [
                    'type' => 'object',
                    'properties' => [
                        'scope' => [
                            'type' => 'string',
                            'enum' => ['upcoming', 'past', 'all'],
                            'description' => 'Which bookings to return. Defaults to upcoming.',
                        ],
                    ],
                    'required' => [],
                ],
            ];
        }

        return $tools;
    }

    /**
     * @param  array<string, mixed>  $input
     */
    private function runTool(string $name, array $input, ?User $user): string
    {
        try {
            $result = match ($name) {
                'get_courts_and_rates' => $this->toolCourts(),
                'get_availability' => $this->toolAvailability((string) ($input['date'] ?? '')),
                'get_open_play_sessions' => $this->toolOpenPlay(),
                'get_policies' => $this->toolPolicies(),
                'get_my_bookings' => $this->toolMyBookings($user, (string) ($input['scope'] ?? 'upcoming')),
                default => ['error' => "Unknown tool: {$name}"],
            };
        } catch (\Throwable $e) {
            Log::error('support.assistant.tool_failed', ['tool' => $name, 'message' => $e->getMessage()]);

            return json_encode(['error' => 'That lookup failed. Tell the user you could not retrieve it right now.']);
        }

        return json_encode($result, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    /**
     * @return array<string, mixed>
     */
    private function toolCourts(): array
    {
        return [
            'courts' => Resource::query()
                ->orderBy('resource_number')
                ->get(['name', 'sport', 'hourly_rate', 'status'])
                ->map(fn (Resource $r) => [
                    'name' => $r->name,
                    'sport' => $r->sport,
                    'hourly_rate' => (float) $r->hourly_rate,
                    'currency' => 'PHP',
                    'status' => $r->status instanceof \BackedEnum ? $r->status->value : $r->status,
                ])
                ->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function toolAvailability(string $date): array
    {
        try {
            $day = Carbon::parse($date)->startOfDay();
        } catch (\Throwable) {
            return ['error' => 'Invalid date. Use YYYY-MM-DD.'];
        }

        $override = DateOverride::query()->whereDate('date', $day->toDateString())->first();

        // Dates are closed unless an admin explicitly opened them with hours.
        if ($override === null || $override->is_closed) {
            return [
                'date' => $day->toDateString(),
                'open' => false,
                'reason' => $override->reason ?? 'The venue has not opened this date for bookings.',
            ];
        }

        $taken = ResourceBooking::query()
            ->whereDate('starts_at', $day->toDateString())
            ->whereIn('status', ResourceBookingRepository::BLOCKING_STATUSES)
            ->get(['resource_id', 'starts_at', 'ends_at']);

        $courts = Resource::query()->orderBy('resource_number')->get(['id', 'name', 'hourly_rate']);
        $open = Carbon::parse($day->toDateString().' '.$override->open_time);
        $close = Carbon::parse($day->toDateString().' '.$override->close_time);

        $availability = [];

        foreach ($courts as $court) {
            $slots = [];

            for ($slot = $open->copy(); $slot->copy()->addHour()->lte($close); $slot->addHour()) {
                $slotEnd = $slot->copy()->addHour();

                $isTaken = $taken->contains(
                    fn ($b) => $b->resource_id === $court->id
                        && $b->starts_at->lt($slotEnd)
                        && $b->ends_at->gt($slot),
                );

                if (! $isTaken && $slot->isFuture()) {
                    $slots[] = $slot->format('g:i A');
                }
            }

            $availability[] = [
                'court' => $court->name,
                'hourly_rate' => (float) $court->hourly_rate,
                'open_slots' => $slots,
            ];
        }

        return [
            'date' => $day->toDateString(),
            'open' => true,
            'hours' => substr((string) $override->open_time, 0, 5).'–'.substr((string) $override->close_time, 0, 5),
            'courts' => $availability,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function toolOpenPlay(): array
    {
        return [
            'sessions' => OpenPlaySession::query()
                ->where('starts_at', '>=', now())
                ->withCount('registrations')
                ->orderBy('starts_at')
                ->limit(10)
                ->get()
                ->map(fn (OpenPlaySession $s) => [
                    'title' => $s->title,
                    'starts_at' => $s->starts_at?->format('M j, Y g:i A'),
                    'ends_at' => $s->ends_at?->format('g:i A'),
                    'location' => $s->location,
                    'price_per_player' => $s->price_per_player !== null ? (float) $s->price_per_player : null,
                    'max_players' => $s->max_players,
                    'registered' => $s->registrations_count,
                ])
                ->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function toolPolicies(): array
    {
        return [
            'policies' => Policy::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->get(['title', 'body'])
                ->map(fn (Policy $p) => ['title' => $p->title, 'body' => strip_tags((string) $p->body)])
                ->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function toolMyBookings(?User $user, string $scope): array
    {
        if ($user === null) {
            return ['error' => 'Nobody is signed in, so there are no personal bookings to read.'];
        }

        $query = ResourceBooking::query()
            ->where('user_id', $user->id)
            ->with('resource:id,name');

        match ($scope) {
            'past' => $query->where('starts_at', '<', now())->latest('starts_at'),
            'all' => $query->latest('starts_at'),
            default => $query->where('starts_at', '>=', now())->orderBy('starts_at'),
        };

        return [
            'scope' => $scope,
            'bookings' => $query->limit(15)->get()->map(fn (ResourceBooking $b) => [
                'id' => $b->id,
                'court' => $b->resource?->name,
                'date' => $b->starts_at->format('M j, Y'),
                'time' => $b->starts_at->format('g:i A').'–'.$b->ends_at->format('g:i A'),
                'status' => $b->status->value,
                'payment_status' => $b->payment_status->value,
                'amount' => (float) $b->amount,
                'can_reschedule' => $user->can('reschedule', $b),
                'reschedule_deadline' => in_array($b->status, [BookingStatus::Pending, BookingStatus::Approved], true)
                    ? $b->starts_at->copy()->subDays(2)->format('M j, Y g:i A')
                    : null,
            ])->all(),
        ];
    }
}
