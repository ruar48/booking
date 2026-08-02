<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $player_id
 * @property string $badge_name
 * @property string|null $badge_icon
 * @property string|null $description
 * @property Carbon $earned_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'player_id',
    'badge_name',
    'badge_icon',
    'description',
    'earned_at',
])]
class PlayerAchievement extends Model
{
    protected function casts(): array
    {
        return [
            'earned_at' => 'datetime',
        ];
    }

    public function player(): BelongsTo
    {
        return $this->belongsTo(Player::class);
    }
}
