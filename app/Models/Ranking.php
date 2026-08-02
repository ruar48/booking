<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $player_id
 * @property int|null $club_id
 * @property string|null $region
 * @property int $elo_rating
 * @property int $wins
 * @property int $losses
 * @property int $matches_played
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'player_id',
    'club_id',
    'region',
    'elo_rating',
    'wins',
    'losses',
    'matches_played',
])]
class Ranking extends Model
{
    public function player(): BelongsTo
    {
        return $this->belongsTo(Player::class);
    }

    public function club(): BelongsTo
    {
        return $this->belongsTo(Club::class);
    }
}
