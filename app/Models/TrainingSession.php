<?php

namespace App\Models;

use Database\Factories\TrainingSessionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $coach_id
 * @property int $club_id
 * @property int|null $court_id
 * @property string $title
 * @property string|null $description
 * @property Carbon $scheduled_at
 * @property int $duration_minutes
 * @property string|null $notes
 * @property string|null $coach_feedback
 * @property string $status
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'coach_id',
    'club_id',
    'court_id',
    'title',
    'description',
    'scheduled_at',
    'duration_minutes',
    'notes',
    'coach_feedback',
    'status',
])]
class TrainingSession extends Model
{
    /** @use HasFactory<TrainingSessionFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'scheduled_at' => 'datetime',
        ];
    }

    public function coach(): BelongsTo
    {
        return $this->belongsTo(Coach::class);
    }

    public function club(): BelongsTo
    {
        return $this->belongsTo(Club::class);
    }

    public function court(): BelongsTo
    {
        return $this->belongsTo(Resource::class, 'court_id');
    }

    public function attendance(): HasMany
    {
        return $this->hasMany(TrainingAttendance::class);
    }

    public function drills(): HasMany
    {
        return $this->hasMany(TrainingDrill::class);
    }
}
