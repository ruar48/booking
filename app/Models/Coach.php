<?php

namespace App\Models;

use Database\Factories\CoachFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

/**
 * @property int $id
 * @property int|null $user_id Set only for coaches who also log in.
 * @property string $name
 * @property string|null $photo_path Relative to the 'coaches' disk.
 * @property string|null $phone
 * @property array|null $certifications
 * @property int $years_experience
 * @property string|null $bio
 * @property array|null $specialties
 * @property string|null $rate_per_hour
 * @property list<array{day: int, start: string, end: string}>|null $availability
 *                                                                                Weekly slots; day is Carbon's dayOfWeek (0 = Sunday), times are H:i.
 * @property bool $is_active
 * @property int $sort_order
 * @property-read string|null $photo_url
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 */
#[Fillable([
    'user_id',
    'name',
    'photo_path',
    'phone',
    'certifications',
    'years_experience',
    'bio',
    'specialties',
    'rate_per_hour',
    'availability',
    'is_active',
    'sort_order',
])]
class Coach extends Model
{
    /** @use HasFactory<CoachFactory> */
    use HasFactory, SoftDeletes;

    protected $appends = ['photo_url'];

    protected function casts(): array
    {
        return [
            'certifications' => 'array',
            'specialties' => 'array',
            'availability' => 'array',
            'rate_per_hour' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function players(): BelongsToMany
    {
        return $this->belongsToMany(Player::class)->withTimestamps();
    }

    public function trainingSessions(): HasMany
    {
        return $this->hasMany(TrainingSession::class);
    }

    protected function photoUrl(): Attribute
    {
        return Attribute::get(fn (): ?string => $this->photo_path
            ? Storage::disk('coaches')->url($this->photo_path)
            : null);
    }
}
