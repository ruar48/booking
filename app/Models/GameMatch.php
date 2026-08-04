<?php

namespace App\Models;

use App\Enums\MatchStatus;
use Database\Factories\GameMatchFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int|null $tournament_id
 * @property int|null $court_id
 * @property int|null $player1_id
 * @property int|null $player2_id
 * @property int|null $winner_id
 * @property int|null $referee_id
 * @property int $round
 * @property int $match_number
 * @property int|null $bracket_position
 * @property MatchStatus $status
 * @property string|null $result_type
 * @property Carbon|null $scheduled_at
 * @property Carbon|null $started_at
 * @property Carbon|null $completed_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'tournament_id',
    'court_id',
    'player1_id',
    'player2_id',
    'winner_id',
    'referee_id',
    'round',
    'match_number',
    'bracket_position',
    'status',
    'result_type',
    'scheduled_at',
    'started_at',
    'completed_at',
])]
class GameMatch extends Model
{
    /** @use HasFactory<GameMatchFactory> */
    use HasFactory;

    protected $table = 'matches';

    protected function casts(): array
    {
        return [
            'status' => MatchStatus::class,
            'scheduled_at' => 'datetime',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function tournament(): BelongsTo
    {
        return $this->belongsTo(Tournament::class);
    }

    public function court(): BelongsTo
    {
        return $this->belongsTo(Resource::class, 'court_id');
    }

    public function player1(): BelongsTo
    {
        return $this->belongsTo(Player::class, 'player1_id');
    }

    public function player2(): BelongsTo
    {
        return $this->belongsTo(Player::class, 'player2_id');
    }

    public function winner(): BelongsTo
    {
        return $this->belongsTo(Player::class, 'winner_id');
    }

    public function referee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referee_id');
    }

    public function sets(): HasMany
    {
        return $this->hasMany(MatchSet::class, 'match_id');
    }

    public function timelineEvents(): HasMany
    {
        return $this->hasMany(MatchTimelineEvent::class, 'match_id');
    }

    public function rankingHistory(): HasMany
    {
        return $this->hasMany(RankingHistory::class, 'match_id');
    }
}
