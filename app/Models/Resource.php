<?php

namespace App\Models;

use App\Enums\ResourceStatus;
use App\Enums\Sport;
use Database\Factories\ResourceFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property Sport $sport
 * @property string $name
 * @property string $resource_number
 * @property string $surface_type
 * @property string $location_type
 * @property bool $has_lighting
 * @property string $hourly_rate
 * @property ResourceStatus $status
 * @property array|null $photos
 * @property string|null $description
 * @property array|null $metadata
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 */
#[Fillable([
    'sport',
    'name',
    'resource_number',
    'surface_type',
    'location_type',
    'has_lighting',
    'hourly_rate',
    'status',
    'photos',
    'description',
    'metadata',
])]
class Resource extends Model
{
    /** @use HasFactory<ResourceFactory> */
    use HasFactory, SoftDeletes;

    protected function casts(): array
    {
        return [
            'sport' => Sport::class,
            'has_lighting' => 'boolean',
            'hourly_rate' => 'decimal:2',
            'status' => ResourceStatus::class,
            'photos' => 'array',
            'metadata' => 'array',
        ];
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(ResourceBooking::class);
    }

    public function matches(): HasMany
    {
        return $this->hasMany(GameMatch::class, 'court_id');
    }

    public function trainingSessions(): HasMany
    {
        return $this->hasMany(TrainingSession::class, 'court_id');
    }
}
