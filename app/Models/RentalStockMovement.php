<?php

namespace App\Models;

use App\Enums\RentalMovementType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $rental_item_id
 * @property int|null $user_id
 * @property RentalMovementType $type
 * @property int $quantity_change
 * @property int $quantity_after
 * @property string|null $reason
 * @property string|null $reference_type
 * @property int|null $reference_id
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'rental_item_id',
    'user_id',
    'type',
    'quantity_change',
    'quantity_after',
    'reason',
    'reference_type',
    'reference_id',
])]
class RentalStockMovement extends Model
{
    protected function casts(): array
    {
        return [
            'type' => RentalMovementType::class,
        ];
    }

    public function rentalItem(): BelongsTo
    {
        return $this->belongsTo(RentalItem::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reference(): MorphTo
    {
        return $this->morphTo();
    }
}
