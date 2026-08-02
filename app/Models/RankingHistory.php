<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $player_id
 * @property int|null $match_id
 * @property int $elo_before
 * @property int $elo_after
 * @property int $elo_change
 * @property Carbon $recorded_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'player_id',
    'match_id',
    'elo_before',
    'elo_after',
    'elo_change',
    'recorded_at',
])]
class RankingHistory extends Model
{
    protected $table = 'ranking_history';

    protected function casts(): array
    {
        return [
            'recorded_at' => 'datetime',
        ];
    }

    public function player(): BelongsTo
    {
        return $this->belongsTo(Player::class);
    }

    public function match(): BelongsTo
    {
        return $this->belongsTo(GameMatch::class, 'match_id');
    }
}
