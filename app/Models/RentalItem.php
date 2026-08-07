<?php

namespace App\Models;

use App\Enums\RentalItemStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property string $sku
 * @property string|null $category
 * @property string $rate
 * @property string|null $hourly_rate
 * @property int $total_quantity
 * @property int $available_quantity
 * @property RentalItemStatus $status
 * @property string|null $description
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 */
#[Fillable([
    'name',
    'sku',
    'category',
    'rate',
    'hourly_rate',
    'total_quantity',
    'available_quantity',
    'status',
    'description',
])]
class RentalItem extends Model
{
    use SoftDeletes;

    protected function casts(): array
    {
        return [
            'status' => RentalItemStatus::class,
            'rate' => 'decimal:2',
            'hourly_rate' => 'decimal:2',
        ];
    }

    public function movements(): HasMany
    {
        return $this->hasMany(RentalStockMovement::class);
    }

    public function transactionItems(): HasMany
    {
        return $this->hasMany(RentalTransactionItem::class);
    }

    public function isOutOfStock(): bool
    {
        return $this->available_quantity <= 0;
    }
}
