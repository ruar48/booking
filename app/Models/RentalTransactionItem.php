<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $rental_transaction_id
 * @property int $rental_item_id
 * @property string $rental_item_name
 * @property int $quantity
 * @property string $rate
 * @property int $quantity_returned
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'rental_transaction_id',
    'rental_item_id',
    'rental_item_name',
    'quantity',
    'rate',
    'quantity_returned',
])]
class RentalTransactionItem extends Model
{
    protected function casts(): array
    {
        return [
            'rate' => 'decimal:2',
        ];
    }

    public function rentalTransaction(): BelongsTo
    {
        return $this->belongsTo(RentalTransaction::class);
    }

    /**
     * Includes soft-deleted items: a transaction must still reach the item it
     * rented after an admin deletes it, or returning those units fails.
     */
    public function rentalItem(): BelongsTo
    {
        return $this->belongsTo(RentalItem::class)->withTrashed();
    }
}
