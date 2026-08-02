<?php

namespace App\Models;

use App\Enums\TournamentFormat;
use App\Enums\TournamentStatus;
use Database\Factories\TournamentFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $club_id
 * @property int $created_by
 * @property string $name
 * @property string $slug
 * @property string|null $description
 * @property string|null $poster
 * @property string $entry_fee
 * @property int $max_players
 * @property TournamentFormat $format
 * @property TournamentStatus $status
 * @property Carbon|null $registration_opens_at
 * @property Carbon|null $registration_closes_at
 * @property Carbon|null $starts_at
 * @property Carbon|null $ends_at
 * @property int|null $champion_id
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 */
#[Fillable([
    'club_id',
    'created_by',
    'name',
    'slug',
    'description',
    'poster',
    'entry_fee',
    'max_players',
    'format',
    'status',
    'registration_opens_at',
    'registration_closes_at',
    'starts_at',
    'ends_at',
    'champion_id',
])]
class Tournament extends Model
{
    /** @use HasFactory<TournamentFactory> */
    use HasFactory, SoftDeletes;

    protected function casts(): array
    {
        return [
            'entry_fee' => 'decimal:2',
            'format' => TournamentFormat::class,
            'status' => TournamentStatus::class,
            'registration_opens_at' => 'datetime',
            'registration_closes_at' => 'datetime',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
        ];
    }

    public function club(): BelongsTo
    {
        return $this->belongsTo(Club::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function champion(): BelongsTo
    {
        return $this->belongsTo(Player::class, 'champion_id');
    }

    public function categories(): HasMany
    {
        return $this->hasMany(TournamentCategory::class);
    }

    public function registrations(): HasMany
    {
        return $this->hasMany(TournamentRegistration::class);
    }

    public function matches(): HasMany
    {
        return $this->hasMany(GameMatch::class);
    }
}
