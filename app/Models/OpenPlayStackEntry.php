<?php

namespace App\Models;

use App\Enums\OpenPlayStackStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * One player's place in a paddle-stacking session: in line, on a court, or
 * sitting out.
 *
 * @property int $id
 * @property int $open_play_session_id
 * @property int $player_id
 * @property OpenPlayStackStatus $status
 * @property int|null $resource_id
 * @property int $position
 * @property int $games_played
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'open_play_session_id',
    'player_id',
    'status',
    'resource_id',
    'position',
    'games_played',
])]
class OpenPlayStackEntry extends Model
{
    protected function casts(): array
    {
        return [
            'status' => OpenPlayStackStatus::class,
            'position' => 'integer',
            'games_played' => 'integer',
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

    /** The court the player is on while playing. */
    public function resource(): BelongsTo
    {
        return $this->belongsTo(Resource::class);
    }
}
