<?php

namespace App\Services\Messenger;

use App\Enums\MessengerDirection;
use App\Enums\MessengerMessageSource;
use App\Events\MessengerConversationUpdated;
use App\Integrations\Meta\MessengerClient;
use App\Integrations\Meta\MessengerException;
use App\Models\MessengerConversation;
use App\Models\MessengerMessage;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

/**
 * The staff side of the Page's Messenger: the conversation list, a thread,
 * replying, and marking a chat as read.
 */
class MessengerInboxService
{
    private const CONVERSATION_LIMIT = 100;

    private const THREAD_LIMIT = 200;

    public function __construct(
        private readonly MessengerClient $client,
        private readonly MessengerSender $sender,
    ) {}

    public function isAvailable(): bool
    {
        return $this->client->isConfigured();
    }

    public function unreadConversationCount(): int
    {
        return MessengerConversation::query()->where('unread_count', '>', 0)->count();
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function conversations(): array
    {
        return MessengerConversation::query()
            ->with('user:id,name,email')
            ->whereNotNull('last_message_at')
            ->orderByDesc('last_message_at')
            ->limit(self::CONVERSATION_LIMIT)
            ->get()
            ->map(fn (MessengerConversation $conversation) => [
                'id' => $conversation->id,
                'name' => $conversation->displayName(),
                'avatarUrl' => $conversation->avatar_url,
                'preview' => $conversation->last_message_preview,
                'lastMessageAt' => $conversation->last_message_at?->toIso8601String(),
                'unreadCount' => $conversation->unread_count,
                'linkedUser' => $conversation->user ? ['id' => $conversation->user->id, 'name' => $conversation->user->name] : null,
                'windowOpen' => $conversation->hasOpenWindow(),
            ])
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    public function thread(MessengerConversation $conversation): array
    {
        $conversation->loadMissing('user:id,name,email,phone');

        $messages = $conversation->messages()
            ->with('sentBy:id,name')
            ->orderByDesc('sent_at')
            ->orderByDesc('id')
            ->limit(self::THREAD_LIMIT)
            ->get()
            ->reverse()
            ->values();

        return [
            'id' => $conversation->id,
            'name' => $conversation->displayName(),
            'avatarUrl' => $conversation->avatar_url,
            'linkedUser' => $conversation->user ? [
                'id' => $conversation->user->id,
                'name' => $conversation->user->name,
                'email' => $conversation->user->email,
                'phone' => $conversation->user->phone,
            ] : null,
            'lastInboundAt' => $conversation->last_inbound_at?->toIso8601String(),
            'canReply' => $conversation->canReply(),
            'usesHumanAgentTag' => ! $conversation->hasOpenWindow() && $conversation->canReplyAsHumanAgent(),
            'replyWindowEndsAt' => $conversation->replyWindowEndsAt()?->toIso8601String(),
            'messages' => $messages->map(fn (MessengerMessage $message) => [
                'id' => $message->id,
                'direction' => $message->direction->value,
                'source' => $message->source->value,
                'sourceLabel' => $message->source->label(),
                'status' => $message->status->value,
                'text' => $message->text,
                'attachments' => $message->attachments ?? [],
                'sentBy' => $message->sentBy?->name,
                'error' => $message->error,
                'sentAt' => $message->sent_at->toIso8601String(),
            ])->all(),
        ];
    }

    /**
     * @throws ValidationException when Meta would refuse the reply
     */
    public function reply(MessengerConversation $conversation, string $text, User $staff): MessengerMessage
    {
        if (! $conversation->canReply()) {
            throw ValidationException::withMessages([
                'text' => __('Messenger only allows replies within 24 hours of the customer\'s last message. Ask them to message the Page again.'),
            ]);
        }

        $message = $this->sender->sendText($conversation, $text, MessengerMessageSource::Reply, $staff);

        // Replying means staff have read everything before it.
        $conversation->forceFill(['unread_count' => 0])->save();

        return $message;
    }

    /**
     * Clears the unread badge and shows "Seen" to the person in Messenger.
     */
    public function markRead(MessengerConversation $conversation): void
    {
        $hadUnread = $conversation->unread_count > 0;

        if ($hadUnread) {
            $conversation->forceFill(['unread_count' => 0])->save();
            MessengerConversationUpdated::broadcastSafely($conversation);
        }

        $lastIsInbound = $conversation->messages()->latest('sent_at')->value('direction') === MessengerDirection::Inbound;

        // Meta only accepts sender actions inside the window. "Seen" is a
        // courtesy, so a refusal is not worth surfacing to staff.
        if ($hadUnread && $lastIsInbound && $conversation->hasOpenWindow()) {
            try {
                $this->client->markSeen($conversation->psid);
            } catch (MessengerException $e) {
                Log::info('messenger.mark_seen_failed', ['conversation_id' => $conversation->id, 'error' => $e->getMessage()]);
            }
        }
    }
}
