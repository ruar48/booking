<?php

namespace App\Events;

use App\Models\MessengerConversation;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Tells open inbox pages that a conversation changed — a new message, a
 * delivery or read receipt, or a status change — so they reload it.
 */
class MessengerConversationUpdated implements ShouldBroadcastNow
{
    use Dispatchable;

    public function __construct(
        public readonly int $conversationId,
    ) {}

    /**
     * Broadcasting is a convenience — the inbox also polls — so a Pusher
     * outage must never fail the webhook or the send that triggered it.
     */
    public static function broadcastSafely(MessengerConversation $conversation): void
    {
        try {
            event(new self($conversation->id));
        } catch (Throwable $e) {
            Log::warning('messenger.broadcast_failed', [
                'conversation_id' => $conversation->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [new PrivateChannel('messenger.inbox')];
    }

    public function broadcastAs(): string
    {
        return 'conversation.updated';
    }

    /**
     * @return array{conversation_id: int}
     */
    public function broadcastWith(): array
    {
        return ['conversation_id' => $this->conversationId];
    }
}
