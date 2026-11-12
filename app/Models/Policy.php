<?php

namespace App\Models;

use App\Enums\PolicyPlacement;
use App\Enums\Sport;
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
 * @property Sport|null $sport Court rules only: the sport they apply to, or null for every sport.
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
    'sport',
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
            if ($policy->isDirty(['title', 'body', 'placement', 'sport'])) {
                $policy->version = (int) $policy->getOriginal('version') + 1;
            }
        });
    }

    protected function casts(): array
    {
        return [
            'placement' => PolicyPlacement::class,
            'sport' => Sport::class,
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
        return self::linesOf(static::activeAt($placement));
    }

    /**
     * The active court rules, split by sport: `general` apply to every sport,
     * and `sports` holds each sport's own rules (only sports that have some),
     * keyed by the Sport value. Pages show a sport's rules followed by the
     * general ones.
     *
     * @return array{general: list<string>, sports: array<string, list<string>>}
     */
    public static function courtRuleBook(): array
    {
        $policies = self::query()
            ->where('placement', PolicyPlacement::CourtRules)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('title')
            ->get(['id', 'sport', 'body']);

        $sports = [];

        foreach (Sport::cases() as $sport) {
            $lines = self::linesOf($policies->filter(fn (Policy $policy): bool => $policy->sport === $sport));

            if ($lines !== []) {
                $sports[$sport->value] = $lines;
            }
        }

        return [
            'general' => self::linesOf($policies->filter(fn (Policy $policy): bool => $policy->sport === null)),
            'sports' => $sports,
        ];
    }

    /**
     * A policy body holds one rule per line; blank lines are skipped.
     *
     * @param  Collection<int, Policy>  $policies
     * @return list<string>
     */
    private static function linesOf(Collection $policies): array
    {
        return $policies
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
