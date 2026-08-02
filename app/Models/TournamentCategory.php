<?php

namespace App\Models;

use Database\Factories\TournamentCategoryFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $tournament_id
 * @property string $name
 * @property string|null $gender
 * @property string|null $age_group
 * @property int|null $max_participants
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'tournament_id',
    'name',
    'gender',
    'age_group',
    'max_participants',
])]
class TournamentCategory extends Model
{
    /** @use HasFactory<TournamentCategoryFactory> */
    use HasFactory;

    public function tournament(): BelongsTo
    {
        return $this->belongsTo(Tournament::class);
    }

    public function registrations(): HasMany
    {
        return $this->hasMany(TournamentRegistration::class);
    }
}
