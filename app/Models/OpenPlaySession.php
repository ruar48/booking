<?php

namespace App\Models;

use App\Enums\BracketGenerationMode;
use App\Enums\TeamSize;
use App\Enums\TournamentFormat;
use Database\Factories\OpenPlaySessionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $title
 * @property string|null $description
 * @property Carbon $starts_at
 * @property Carbon|null $ends_at
 * @property Carbon|null $registration_closes_at
 * @property string|null $location
 * @property float|null $price_per_player
 * @property int|null $max_players
 * @property int $target_score
 * @property TournamentFormat|null $bracket_format
 * @property BracketGenerationMode $bracket_generation
 * @property bool $bracket_visible
 * @property string $skill_level
 * @property TeamSize $team_size
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'title',
    'description',
    'starts_at',
    'ends_at',
    'registration_closes_at',
    'location',
    'price_per_player',
    'max_players',
    'target_score',
    'bracket_format',
    'bracket_generation',
    'bracket_visible',
    'skill_level',
    'team_size',
])]
class OpenPlaySession extends Model
{
    /** @use HasFactory<OpenPlaySessionFactory> */
    use HasFactory;

    protected $appends = ['is_registration_closed'];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'registration_closes_at' => 'datetime',
            'price_per_player' => 'decimal:2',
            'max_players' => 'integer',
            'target_score' => 'integer',
            'bracket_format' => TournamentFormat::class,
            'bracket_generation' => BracketGenerationMode::class,
            'bracket_visible' => 'boolean',
            'team_size' => TeamSize::class,
        ];
    }

    protected function isRegistrationClosed(): Attribute
    {
        return Attribute::make(
            get: fn (): bool => $this->registration_closes_at !== null
                && $this->registration_closes_at->isPast(),
        );
    }

    public function registrations(): HasMany
    {
        return $this->hasMany(OpenPlayRegistration::class);
    }

    public function matches(): HasMany
    {
        return $this->hasMany(OpenPlayMatch::class);
    }
}
