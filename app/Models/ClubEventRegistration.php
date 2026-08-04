<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $club_event_id
 * @property int $player_id
 * @property int|null $partner_player_id
 * @property int|null $created_by
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'club_event_id',
    'player_id',
    'partner_player_id',
    'created_by',
])]
class ClubEventRegistration extends Model
{
    public function clubEvent(): BelongsTo
    {
        return $this->belongsTo(ClubEvent::class);
    }

    public function player(): BelongsTo
    {
        return $this->belongsTo(Player::class);
    }

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Player::class, 'partner_player_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
