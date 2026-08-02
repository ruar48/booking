<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $training_session_id
 * @property int $player_id
 * @property bool $attended
 * @property string|null $progress_notes
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'training_session_id',
    'player_id',
    'attended',
    'progress_notes',
])]
class TrainingAttendance extends Model
{
    protected $table = 'training_attendance';

    protected function casts(): array
    {
        return [
            'attended' => 'boolean',
        ];
    }

    public function trainingSession(): BelongsTo
    {
        return $this->belongsTo(TrainingSession::class);
    }

    public function player(): BelongsTo
    {
        return $this->belongsTo(Player::class);
    }
}
