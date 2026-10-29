<?php

namespace App\Models;

use App\Enums\PaymentStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $open_play_session_id
 * @property int $player_id
 * @property int|null $partner_player_id
 * @property int|null $group_lead_id
 * @property PaymentStatus $payment_status
 * @property string $amount
 * @property int|null $created_by
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'open_play_session_id',
    'player_id',
    'partner_player_id',
    'group_lead_id',
    'payment_status',
    'amount',
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

    /**
     * Registrations for friends that this registration's payment also covers.
     *
     * @return HasMany<OpenPlayRegistration, $this>
     */
    public function groupMembers(): HasMany
    {
        return $this->hasMany(self::class, 'group_lead_id');
    }

    /**
     * @return BelongsTo<self, $this>
     */
    public function groupLead(): BelongsTo
    {
        return $this->belongsTo(self::class, 'group_lead_id');
    }

    /**
     * @return MorphMany<Payment, $this>
     */
    public function payments(): MorphMany
    {
        return $this->morphMany(Payment::class, 'payable');
    }
}
