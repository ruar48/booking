<?php

namespace App\Models;

use App\Enums\MessengerDirection;
use App\Enums\MessengerMessageSource;
use App\Enums\MessengerMessageStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $conversation_id
 * @property MessengerDirection $direction
 * @property MessengerMessageSource $source
 * @property MessengerMessageStatus $status
 * @property string|null $mid
 * @property string|null $text
 * @property list<array{type: string, url: string|null}>|null $attachments
 * @property int|null $sent_by_id
 * @property string|null $error
 * @property Carbon $sent_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['conversation_id', 'direction', 'source', 'status', 'mid', 'text', 'attachments', 'sent_by_id', 'error', 'sent_at'])]
class MessengerMessage extends Model
{
    protected function casts(): array
    {
        return [
            'direction' => MessengerDirection::class,
            'source' => MessengerMessageSource::class,
            'status' => MessengerMessageStatus::class,
            'attachments' => 'array',
            'sent_at' => 'datetime',
        ];
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(MessengerConversation::class, 'conversation_id');
    }

    public function sentBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sent_by_id');
    }
}
