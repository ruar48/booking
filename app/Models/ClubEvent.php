<?php

namespace App\Models;

use Database\Factories\ClubEventFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $club_id
 * @property string $title
 * @property string|null $description
 * @property Carbon $starts_at
 * @property Carbon|null $ends_at
 * @property string|null $location
 * @property float|null $price_per_player
 * @property int|null $max_players
 * @property int $target_score
 * @property string $skill_level
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'club_id',
    'title',
    'description',
    'starts_at',
    'ends_at',
    'location',
    'price_per_player',
    'max_players',
    'target_score',
    'skill_level',
])]
class ClubEvent extends Model
{
    /** @use HasFactory<ClubEventFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'price_per_player' => 'decimal:2',
            'max_players' => 'integer',
            'target_score' => 'integer',
        ];
    }

    public function club(): BelongsTo
    {
        return $this->belongsTo(Club::class);
    }

    public function registrations(): HasMany
    {
        return $this->hasMany(ClubEventRegistration::class);
    }

    public function matches(): HasMany
    {
        return $this->hasMany(ClubEventMatch::class);
    }
}
