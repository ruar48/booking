<?php

namespace App\Models;

use App\Enums\PaymentStatus;
use Database\Factories\TournamentRegistrationFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $tournament_id
 * @property int|null $tournament_category_id
 * @property int $player_id
 * @property PaymentStatus $payment_status
 * @property int|null $seed
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'tournament_id',
    'tournament_category_id',
    'player_id',
    'payment_status',
    'seed',
])]
class TournamentRegistration extends Model
{
    /** @use HasFactory<TournamentRegistrationFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'payment_status' => PaymentStatus::class,
        ];
    }

    public function tournament(): BelongsTo
    {
        return $this->belongsTo(Tournament::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(TournamentCategory::class, 'tournament_category_id');
    }

    public function player(): BelongsTo
    {
        return $this->belongsTo(Player::class);
    }

    public function payments(): MorphMany
    {
        return $this->morphMany(Payment::class, 'payable');
    }
}
