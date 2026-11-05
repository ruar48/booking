<?php

namespace App\Models;

use App\Enums\PolicyPlacement;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property string $title
 * @property string $slug
 * @property PolicyPlacement $placement
 * @property string $body
 * @property bool $is_active
 * @property int $version
 * @property int $sort_order
 * @property int|null $updated_by
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'title',
    'slug',
    'placement',
    'body',
    'is_active',
    'version',
    'sort_order',
    'updated_by',
])]
class Policy extends Model
{
    protected static function booted(): void
    {
        static::creating(function (Policy $policy) {
            if (blank($policy->slug)) {
                $policy->slug = Str::slug($policy->title).'-'.Str::random(6);
            }
        });

        static::updating(function (Policy $policy) {
            if ($policy->isDirty(['title', 'body', 'placement'])) {
                $policy->version = (int) $policy->getOriginal('version') + 1;
            }
        });
    }

    protected function casts(): array
    {
        return [
            'placement' => PolicyPlacement::class,
            'is_active' => 'boolean',
            'version' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    /**
     * The active policies at a placement, in the order customers see them.
     *
     * @return Collection<int, Policy>
     */
    public static function activeAt(PolicyPlacement $placement): Collection
    {
        return self::query()
            ->where('placement', $placement)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('title')
            ->get(['id', 'title', 'body', 'version']);
    }

    /**
     * Every line of the active policies at a placement, in display order — a
     * policy body holds one rule per line.
     *
     * @return array<int, string>
     */
    public static function linesAt(PolicyPlacement $placement): array
    {
        return static::activeAt($placement)
            ->pluck('body')
            ->flatMap(fn (string $body): array => preg_split('/\R/', $body) ?: [])
            ->map(fn (string $line): string => trim($line))
            ->filter()
            ->values()
            ->all();
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
