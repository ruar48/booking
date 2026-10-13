<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\MassPrunable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * One page a visitor loaded. Written by the RecordPageView middleware.
 *
 * @property int $id
 * @property int|null $user_id
 * @property string $visitor_hash
 * @property string $path
 * @property string|null $route_name
 * @property string $device
 * @property string|null $referrer_host
 * @property Carbon $created_at
 */
#[Fillable(['user_id', 'visitor_hash', 'path', 'route_name', 'device', 'referrer_host', 'created_at'])]
class PageView extends Model
{
    use MassPrunable;

    /** How long raw page views are kept before `model:prune` deletes them. */
    public const RETENTION_DAYS = 180;

    public const UPDATED_AT = null;

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return Builder<PageView>
     */
    public function prunable(): Builder
    {
        return static::query()->where('created_at', '<', now()->subDays(self::RETENTION_DAYS));
    }
}
