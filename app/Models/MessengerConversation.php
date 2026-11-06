<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $psid
 * @property int|null $user_id
 * @property Carbon|null $linked_at
 * @property string|null $name
 * @property string|null $avatar_url
 * @property string|null $last_message_preview
 * @property Carbon|null $last_message_at
 * @property Carbon|null $last_inbound_at
 * @property int $unread_count
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['psid', 'user_id', 'linked_at', 'name', 'avatar_url', 'last_message_preview', 'last_message_at', 'last_inbound_at', 'unread_count'])]
class MessengerConversation extends Model
{
    /**
     * Meta's standard window for ordinary messages, less a margin so a send
     * right at the edge is not rejected.
     */
    private const WINDOW_MINUTES = 24 * 60 - 10;

    /**
     * Meta's HUMAN_AGENT tag stretches staff replies to 7 days, once the app
     * has been approved for it.
     */
    private const HUMAN_AGENT_DAYS = 7;

    protected function casts(): array
    {
        return [
            'linked_at' => 'datetime',
            'last_message_at' => 'datetime',
            'last_inbound_at' => 'datetime',
            'unread_count' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(MessengerMessage::class, 'conversation_id');
    }

    public function latestMessage(): HasOne
    {
        return $this->hasOne(MessengerMessage::class, 'conversation_id')->latestOfMany('sent_at');
    }

    public function displayName(): string
    {
        return $this->name ?: $this->user?->name ?: 'Messenger user '.substr($this->psid, -4);
    }

    /**
     * Whether the Page may send an ordinary message right now.
     */
    public function hasOpenWindow(): bool
    {
        return $this->last_inbound_at !== null
            && $this->last_inbound_at->greaterThan(now()->subMinutes(self::WINDOW_MINUTES));
    }

    /**
     * Whether staff can reply, either inside the standard window or with the
     * HUMAN_AGENT tag when the app is approved for it.
     */
    public function canReply(): bool
    {
        return $this->hasOpenWindow() || $this->canReplyAsHumanAgent();
    }

    public function canReplyAsHumanAgent(): bool
    {
        return (bool) config('services.messenger.human_agent')
            && $this->last_inbound_at !== null
            && $this->last_inbound_at->greaterThan(now()->subDays(self::HUMAN_AGENT_DAYS)->addMinutes(10));
    }

    public function replyWindowEndsAt(): ?Carbon
    {
        if ($this->last_inbound_at === null) {
            return null;
        }

        return $this->canReplyAsHumanAgent() && ! $this->hasOpenWindow()
            ? $this->last_inbound_at->copy()->addDays(self::HUMAN_AGENT_DAYS)
            : $this->last_inbound_at->copy()->addMinutes(self::WINDOW_MINUTES);
    }
}
