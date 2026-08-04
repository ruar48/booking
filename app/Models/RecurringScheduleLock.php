<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $club_id
 * @property int|null $resource_id
 * @property int $day_of_week
 * @property string $starts_at
 * @property string $ends_at
 * @property string|null $reason
 * @property int|null $created_by
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'club_id',
    'resource_id',
    'day_of_week',
    'starts_at',
    'ends_at',
    'reason',
    'created_by',
])]
class RecurringScheduleLock extends Model
{
    public function club(): BelongsTo
    {
        return $this->belongsTo(Club::class);
    }

    public function resource(): BelongsTo
    {
        return $this->belongsTo(Resource::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
