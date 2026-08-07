<?php

namespace App\Models;

use App\Enums\PaymentStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $open_play_session_id
 * @property int $player_id
 * @property int|null $partner_player_id
 * @property PaymentStatus $payment_status
 * @property int|null $created_by
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'open_play_session_id',
    'player_id',
    'partner_player_id',
    'payment_status',
    'created_by',
])]
class OpenPlayRegistration extends Model
{
    protected function casts(): array
    {
        return [
            'payment_status' => PaymentStatus::class,
        ];
    }

    public function openPlaySession(): BelongsTo
    {
        return $this->belongsTo(OpenPlaySession::class);
    }

    public function player(): BelongsTo
    {
        return $this->belongsTo(Player::class);
    }

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Player::class, 'partner_player_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
