<?php

namespace App\Models;

use App\Enums\BracketGenerationMode;
use App\Enums\OpenPlayFormat;
use App\Enums\PaymentStatus;
use App\Enums\TeamSize;
use App\Enums\TournamentFormat;
use Database\Factories\OpenPlaySessionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
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
 * @property OpenPlayFormat $format
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
    'format',
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

    /** How many minutes before the start players can stack their own paddle. */
    public const SELF_STACK_OPENS_MINUTES = 60;

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
            'format' => OpenPlayFormat::class,
            'bracket_format' => TournamentFormat::class,
            'bracket_generation' => BracketGenerationMode::class,
            'bracket_visible' => 'boolean',
            'team_size' => TeamSize::class,
        ];
    }

    /**
     * Closed once the registration deadline passes, or — when no deadline was
     * set — once the session has started. Without the second rule a past
     * session with no deadline still offered "Join".
     */
    protected function isRegistrationClosed(): Attribute
    {
        return Attribute::make(
            get: fn (): bool => ($this->registration_closes_at !== null && $this->registration_closes_at->isPast())
                || ($this->starts_at !== null && $this->starts_at->isPast()),
        );
    }

    public function isPaddleStacking(): bool
    {
        return $this->format === OpenPlayFormat::PaddleStacking;
    }

    /**
     * Whether entries are fixed doubles pairs. Only a doubles bracket needs
     * them; paddle stacking regroups players every game, so everyone
     * registers on their own whatever the match type.
     */
    public function registersAsPairs(): bool
    {
        return $this->format === OpenPlayFormat::Bracket && $this->team_size === TeamSize::Doubles;
    }

    /**
     * Whether players can stack (or pull) their own paddle right now: from
     * shortly before the start until the session ends. Staff can manage the
     * stack at any time.
     */
    public function acceptsSelfStacking(): bool
    {
        if (! $this->isPaddleStacking() || $this->starts_at === null) {
            return false;
        }

        $opensAt = $this->starts_at->copy()->subMinutes(self::SELF_STACK_OPENS_MINUTES);
        $closesAt = $this->ends_at ?? $this->starts_at->copy()->endOfDay();

        return now()->between($opensAt, $closesAt);
    }

    /**
     * The id of the user's player who holds a paid spot in this session, as
     * the registrant or as their named partner.
     */
    public function seatedPlayerIdFor(User $user): ?int
    {
        $playerIds = $user->players()->pluck('id');

        if ($playerIds->isEmpty()) {
            return null;
        }

        $registration = $this->registrations()
            ->where('payment_status', PaymentStatus::Paid)
            ->where(fn ($query) => $query
                ->whereIn('player_id', $playerIds)
                ->orWhereIn('partner_player_id', $playerIds))
            ->first(['player_id', 'partner_player_id']);

        if ($registration === null) {
            return null;
        }

        return $playerIds->contains($registration->player_id)
            ? $registration->player_id
            : $registration->partner_player_id;
    }

    /**
     * Filter by the admin list's format option: "paddle_stacking", or one of
     * the bracket formats.
     *
     * @param  Builder<OpenPlaySession>  $query
     */
    #[Scope]
    protected function ofFormat(Builder $query, string $format): void
    {
        if ($format === OpenPlayFormat::PaddleStacking->value) {
            $query->where('format', OpenPlayFormat::PaddleStacking);

            return;
        }

        $query->where('format', OpenPlayFormat::Bracket)->where('bracket_format', $format);
    }

    public function registrations(): HasMany
    {
        return $this->hasMany(OpenPlayRegistration::class);
    }

    public function matches(): HasMany
    {
        return $this->hasMany(OpenPlayMatch::class);
    }

    public function resources(): BelongsToMany
    {
        return $this->belongsToMany(Resource::class, 'open_play_session_resource');
    }

    /** The paddle stack — used by paddle-stacking sessions only. */
    public function stackEntries(): HasMany
    {
        return $this->hasMany(OpenPlayStackEntry::class);
    }

    /**
     * Number of players holding a paid roster slot. A doubles registration
     * with a partner attached seats two players in one row, so rows can't
     * be counted directly — each row counts as 1 or 2 depending on whether
     * partner_player_id is set.
     */
    public function registeredPlayersCount(): int
    {
        return (int) $this->registrations()
            ->where('payment_status', PaymentStatus::Paid)
            ->selectRaw('COALESCE(SUM(CASE WHEN partner_player_id IS NULL THEN 1 ELSE 2 END), 0) as total')
            ->value('total');
    }
}
