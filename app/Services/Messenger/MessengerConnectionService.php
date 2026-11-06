<?php

namespace App\Services\Messenger;

use App\Enums\MessengerMessageSource;
use App\Enums\MessengerMessageStatus;
use App\Integrations\Meta\MessengerClient;
use App\Models\MessengerConversation;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Links a person's Facebook Messenger to their account here.
 *
 * Meta never reveals who a Messenger user is until they write to the Page, so
 * linking goes: the signed-in user opens m.me/<page>?ref=<one-time token>,
 * Meta sends that token back to the webhook along with their Page-scoped ID
 * (PSID), and the token says which account the conversation belongs to. The
 * token is minted server-side for the authenticated user, so nobody can claim
 * another person's account by editing a request.
 */
class MessengerConnectionService
{
    private const LINK_TTL_MINUTES = 30;

    /**
     * Connect codes look like "GRP-7K4Q9M". No 0/O or 1/I, so they survive
     * being read off a screen and typed on a phone.
     */
    private const CODE_PREFIX = 'GRP-';

    private const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

    private const CODE_LENGTH = 6;

    public function __construct(
        private readonly MessengerClient $client,
        private readonly MessengerSender $sender,
    ) {}

    /**
     * @return array{available: bool, connected: bool, connectedAt: string|null, canMessageNow: bool, connectCode: string|null}
     */
    public function status(User $user): array
    {
        $conversation = $user->messengerConversation;

        return [
            'available' => $this->client->isConfigured(),
            'connected' => $conversation !== null,
            'connectedAt' => $conversation?->linked_at?->toIso8601String(),
            'canMessageNow' => $conversation?->hasOpenWindow() ?? false,
            'connectCode' => $conversation === null ? $this->connectCode($user) : null,
        ];
    }

    /**
     * What the floating Messenger button and the post-payment card need on
     * every page: whether to offer "connect" or just "chat with us".
     *
     * @return array{available: bool, signedIn: bool, connected: bool, chatUrl: string|null}
     */
    public function prompt(?User $user): array
    {
        $available = $this->client->isConfigured();

        return [
            'available' => $available,
            'signedIn' => $user !== null,
            'connected' => $user !== null && $available && $user->messengerConversation()->exists(),
            'chatUrl' => $available ? $this->client->pageChatUrl() : null,
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

    /**
     * A code the user can send our Page as an ordinary message to connect,
     * for when the m.me link's hidden reference gets lost on the way — FB
     * Lite, Messenger chat heads, or a browser signed in as someone else all
     * drop it. The same code is shown until it expires, so a page refresh
     * doesn't invalidate one the user is halfway through typing.
     */
    public function connectCode(User $user): ?string
    {
        if (! $this->client->isConfigured()) {
            return null;
        }

        $userKey = "messenger:user-code:{$user->id}";
        $existing = Cache::get($userKey);

        if (is_string($existing) && Cache::get($this->codeKey($existing)) === $user->id) {
            return self::CODE_PREFIX.$existing;
        }

        $code = collect(range(1, self::CODE_LENGTH))
            ->map(fn () => self::CODE_ALPHABET[random_int(0, strlen(self::CODE_ALPHABET) - 1)])
            ->implode('');

        $expires = now()->addMinutes(self::LINK_TTL_MINUTES);
        Cache::put($this->codeKey($code), $user->id, $expires);
        Cache::put($userKey, $code, $expires);

        return self::CODE_PREFIX.$code;
    }

    /**
     * Links the chat if the message is a connect code. Returns whether the
     * message was meant as one, so the caller can treat it as ordinary text
     * otherwise.
     */
    public function completeLinkFromMessage(?string $text, MessengerConversation $conversation): bool
    {
        if ($text === null || ! preg_match('/\bGRP[\s-]?([A-Z0-9]{'.self::CODE_LENGTH.'})\b/i', $text, $match)) {
            return false;
        }

        $code = strtoupper($match[1]);
        $userId = Cache::pull($this->codeKey($code));
        $user = $userId !== null ? User::query()->find($userId) : null;

        if ($user === null) {
            Log::info('messenger.code_invalid', ['conversation_id' => $conversation->id]);

            $this->replyAfterResponse($conversation, __("That code didn't work or has expired. Open Settings > Messenger on :app for a new one.",['app' => config('app.name')]));

            return true;
        }

        Cache::forget("messenger:user-code:{$user->id}");
        $this->link($user, $conversation);

        return true;
    }

    /**
     * Unlinks the account. The conversation itself stays in the inbox — it is
     * the venue's chat history with that person.
     */
    public function disconnect(User $user): void
    {
        $user->messengerConversation?->forceFill(['user_id' => null, 'linked_at' => null])->save();
    }

    /**
     * Sends a sample message, so a user can check the connection works. Only
     * possible inside the 24-hour window; there is no approved template for
     * a test.
     */
    public function sendTest(User $user): bool
    {
        $conversation = $user->messengerConversation;

        if ($conversation === null || ! $conversation->hasOpenWindow()) {
            return false;
        }

        $message = $this->sender->sendText(
            $conversation,
            __('This is a test message from :app. Booking updates will arrive here just like this one.', ['app' => config('app.name')]),
            MessengerMessageSource::System,
            buttonTitle: __('Open :app', ['app' => Str::limit((string) config('app.name'), 14, '')]),
            buttonUrl: route('dashboard'),
        );

        return $message->status !== MessengerMessageStatus::Failed;
    }

    /**
     * Completes a link from the webhook, once the person has opened the
     * m.me link and Meta has told us their conversation.
     */
    public function completeLink(string $token, MessengerConversation $conversation): void
    {
        $userId = Cache::pull($this->cacheKey($token));
        $user = $userId !== null ? User::query()->find($userId) : null;

        if ($user === null) {
            Log::info('messenger.link_expired', ['conversation_id' => $conversation->id]);

            $this->replyAfterResponse($conversation, __('This connect link has expired. Open Settings > Messenger on :app to get a new one.', ['app' => config('app.name')]));

            return;
        }

        $this->link($user, $conversation);
    }

    private function link(User $user, MessengerConversation $conversation): void
    {
        DB::transaction(function () use ($user, $conversation): void {
            // One account has one Messenger, and one Messenger belongs to one
            // account. Re-linking moves the link rather than failing.
            MessengerConversation::query()
                ->where('user_id', $user->id)
                ->whereKeyNot($conversation->id)
                ->update(['user_id' => null, 'linked_at' => null]);

            $conversation->forceFill([
                'user_id' => $user->id,
                'linked_at' => now(),
                'name' => $conversation->name ?: $user->name,
            ])->save();
        });

        Log::info('messenger.linked', ['user_id' => $user->id, 'conversation_id' => $conversation->id]);

        $this->replyAfterResponse($conversation, __("You're all set, :name! Booking and payment updates from :app will arrive here.", [
            'name' => Str::before(trim($user->name), ' ') ?: $user->name,
            'app' => config('app.name'),
        ]));
    }

    /**
     * Meta retries a webhook that is slow to answer, so the reply goes out
     * after the 200 has been sent.
     */
    private function replyAfterResponse(MessengerConversation $conversation, string $text): void
    {
        $sender = $this->sender;

        dispatch(fn () => $sender->sendText($conversation, $text, MessengerMessageSource::System))->afterResponse();
    }

    private function cacheKey(string $token): string
    {
        return 'messenger:link:'.hash('sha256', $token);
    }

    private function codeKey(string $code): string
    {
        return 'messenger:code:'.strtoupper($code);
    }
}
