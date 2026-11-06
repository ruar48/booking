<?php

namespace App\Services;

use App\Integrations\Meta\MessengerClient;
use App\Integrations\Meta\MessengerException;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Links a person's Facebook Messenger to their account here, and keeps track
 * of whether the Page may currently message them.
 *
 * Meta never reveals who a Messenger user is until they write to the Page, so
 * linking goes: the signed-in user opens m.me/<page>?ref=<one-time token>,
 * Meta sends that token back to the webhook along with their Page-scoped ID
 * (PSID), and the token says which account the PSID belongs to. The token is
 * minted server-side for the authenticated user, so nobody can claim another
 * person's account by editing a request.
 */
class MessengerConnectionService
{
    private const LINK_TTL_MINUTES = 30;

    public function __construct(
        private readonly MessengerClient $client,
    ) {}

    /**
     * @return array{available: bool, connected: bool, connectedAt: string|null, canMessageNow: bool}
     */
    public function status(User $user): array
    {
        return [
            'available' => $this->client->isConfigured(),
            'connected' => $user->messenger_psid !== null,
            'connectedAt' => $user->messenger_connected_at?->toIso8601String(),
            'canMessageNow' => $user->messenger_psid !== null && $user->hasOpenMessengerWindow(),
        ];
    }

    /**
     * A fresh, single-use m.me link that connects whoever opens it to this
     * user's account, or null while Messenger isn't configured.
     */
    public function connectUrl(User $user): ?string
    {
        if (! $this->client->isConfigured()) {
            return null;
        }

        $token = Str::random(40);

        Cache::put($this->cacheKey($token), $user->id, now()->addMinutes(self::LINK_TTL_MINUTES));

        return $this->client->conversationUrl($token);
    }

    public function disconnect(User $user): void
    {
        $user->forceFill([
            'messenger_psid' => null,
            'messenger_connected_at' => null,
            'messenger_last_inbound_at' => null,
        ])->save();
    }

    /**
     * Sends a sample message, so a user can check the connection works. Only
     * possible inside the 24-hour window; there is no approved template for
     * a test.
     */
    public function sendTest(User $user): bool
    {
        if ($user->messenger_psid === null || ! $user->hasOpenMessengerWindow()) {
            return false;
        }

        try {
            $this->client->sendMessage(
                $user->messenger_psid,
                __('This is a test message from :app. Booking updates will arrive here just like this one.', ['app' => config('app.name')]),
                __('Open :app', ['app' => Str::limit((string) config('app.name'), 14, '')]),
                route('dashboard'),
            );

            return true;
        } catch (MessengerException $e) {
            Log::warning('messenger.test_failed', [
                'user_id' => $user->id,
                'graph_code' => $e->graphCode,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Processes one webhook delivery from Meta. Unknown event kinds are
     * ignored: Meta adds fields over time, and a 200 must still go back.
     *
     * @param  array<string, mixed>  $payload
     */
    public function handleWebhook(array $payload): void
    {
        if (($payload['object'] ?? null) !== 'page') {
            return;
        }

        foreach ($payload['entry'] ?? [] as $entry) {
            foreach ($entry['messaging'] ?? [] as $event) {
                if (is_array($event)) {
                    $this->handleMessagingEvent($event);
                }
            }

            foreach ($entry['changes'] ?? [] as $change) {
                if (($change['field'] ?? null) === 'message_template_status_update') {
                    Log::info('messenger.template_status', [
                        'template' => $change['value']['message_template_name'] ?? null,
                        'event' => $change['value']['event'] ?? null,
                        'reason' => $change['value']['reason'] ?? null,
                    ]);
                }
            }
        }
    }

    /**
     * @param  array<string, mixed>  $event
     */
    private function handleMessagingEvent(array $event): void
    {
        $psid = $event['sender']['id'] ?? null;

        // Echoes are the Page's own outgoing messages coming back.
        if (! is_string($psid) || $psid === '' || ! empty($event['message']['is_echo'])) {
            return;
        }

        // The ref arrives on its own for an existing conversation, and inside
        // the "Get Started" postback for a brand-new one.
        $ref = $event['referral']['ref'] ?? $event['postback']['referral']['ref'] ?? null;

        if (is_string($ref) && $ref !== '') {
            $this->completeLink($ref, $psid);

            return;
        }

        // Anything the person sends reopens the 24-hour window.
        if (isset($event['message']) || isset($event['postback'])) {
            User::query()
                ->where('messenger_psid', $psid)
                ->update(['messenger_last_inbound_at' => now()]);
        }
    }

    private function completeLink(string $token, string $psid): void
    {
        $userId = Cache::pull($this->cacheKey($token));
        $user = $userId !== null ? User::query()->find($userId) : null;

        if ($user === null) {
            Log::info('messenger.link_expired', ['psid_suffix' => substr($psid, -4)]);

            $this->replyAfterResponse($psid, __('This connect link has expired. Open Settings > Messenger on :app to get a new one.', ['app' => config('app.name')]));

            return;
        }

        DB::transaction(function () use ($user, $psid): void {
            // One Messenger account belongs to one account here. Re-linking
            // from a different account moves it rather than failing.
            User::query()
                ->where('messenger_psid', $psid)
                ->whereKeyNot($user->id)
                ->update([
                    'messenger_psid' => null,
                    'messenger_connected_at' => null,
                    'messenger_last_inbound_at' => null,
                ]);

            $user->forceFill([
                'messenger_psid' => $psid,
                'messenger_connected_at' => now(),
                'messenger_last_inbound_at' => now(),
            ])->save();
        });

        Log::info('messenger.linked', ['user_id' => $user->id]);

        $this->replyAfterResponse($psid, __("You're all set, :name! Booking and payment updates from :app will arrive here.", [
            'name' => Str::before(trim($user->name), ' ') ?: $user->name,
            'app' => config('app.name'),
        ]));
    }

    /**
     * Meta retries a webhook that is slow to answer, so the reply goes out
     * after the 200 has been sent.
     */
    private function replyAfterResponse(string $psid, string $text): void
    {
        $client = $this->client;

        dispatch(function () use ($client, $psid, $text): void {
            try {
                $client->sendMessage($psid, $text);
            } catch (MessengerException $e) {
                Log::warning('messenger.reply_failed', ['graph_code' => $e->graphCode, 'error' => $e->getMessage()]);
            }
        })->afterResponse();
    }

    private function cacheKey(string $token): string
    {
        return 'messenger:link:'.hash('sha256', $token);
    }
}
