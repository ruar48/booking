<?php

namespace App\Models;

use App\Enums\CourtStatus;
use Database\Factories\CourtFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $club_id
 * @property string $name
 * @property string $court_number
 * @property string $surface_type
 * @property string $location_type
 * @property bool $has_lighting
 * @property string $hourly_rate
 * @property CourtStatus $status
 * @property array|null $photos
 * @property string|null $description
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 */
#[Fillable([
    'club_id',
    'name',
    'court_number',
    'surface_type',
    'location_type',
    'has_lighting',
    'hourly_rate',
    'status',
    'photos',
    'description',
])]
class Court extends Model
{
    /** @use HasFactory<CourtFactory> */
    use HasFactory, SoftDeletes;

    protected function casts(): array
    {
        return [
            'has_lighting' => 'boolean',
            'hourly_rate' => 'decimal:2',
            'status' => CourtStatus::class,
            'photos' => 'array',
        ];
    }

    public function club(): BelongsTo
    {
        return $this->belongsTo(Club::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(CourtBooking::class);
    }

    public function matches(): HasMany
    {
        return $this->hasMany(GameMatch::class);
    }

    public function trainingSessions(): HasMany
    {
        return $this->hasMany(TrainingSession::class);
    }
}
