<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\MassPrunable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property string|null $ip_address
 * @property string|null $user_agent
 * @property string|null $device
 * @property Carbon $logged_in_at
 * @property Carbon|null $logged_out_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'user_id',
    'ip_address',
    'user_agent',
    'device',
    'logged_in_at',
    'logged_out_at',
])]
class LoginHistory extends Model
{
    use MassPrunable;

    /**
     * How long sign-in records are kept for spotting account misuse before
     * `model:prune` deletes them. Stated in the Privacy Notice — keep in sync.
     */
    public const RETENTION_DAYS = 365;

    protected $table = 'login_history';

    /**
     * @return Builder<static>
     */
    public function prunable(): Builder
    {
        return static::query()->where('logged_in_at', '<', now()->subDays(self::RETENTION_DAYS));
    }

    protected function casts(): array
    {
        return [
            'logged_in_at' => 'datetime',
            'logged_out_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
