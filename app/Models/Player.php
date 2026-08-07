<?php

namespace App\Models;

use Database\Factories\PlayerFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property int $skill_rating
 * @property string $experience_level
 * @property string|null $playing_hand
 * @property string|null $gender
 * @property Carbon|null $birthdate
 * @property string|null $phone
 * @property string|null $address
 * @property string|null $emergency_contact_name
 * @property string|null $emergency_contact_phone
 * @property string|null $bio
 * @property bool $is_active
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 */
#[Fillable([
    'user_id',
    'skill_rating',
    'experience_level',
    'playing_hand',
    'gender',
    'birthdate',
    'phone',
    'address',
    'emergency_contact_name',
    'emergency_contact_phone',
    'bio',
    'is_active',
])]
class Player extends Model
{
    /** @use HasFactory<PlayerFactory> */
    use HasFactory, SoftDeletes;

    protected function casts(): array
    {
        return [
            'birthdate' => 'date',
            'is_active' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function achievements(): HasMany
    {
        return $this->hasMany(PlayerAchievement::class);
    }

    public function rankings(): HasMany
    {
        return $this->hasMany(Ranking::class);
    }

    public function rankingHistory(): HasMany
    {
        return $this->hasMany(RankingHistory::class);
    }

    public function coaches(): BelongsToMany
    {
        return $this->belongsToMany(Coach::class)->withTimestamps();
    }

    public function tournamentRegistrations(): HasMany
    {
        return $this->hasMany(TournamentRegistration::class);
    }

    public function trainingAttendance(): HasMany
    {
        return $this->hasMany(TrainingAttendance::class);
    }
}
