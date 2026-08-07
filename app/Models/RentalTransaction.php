<?php

namespace App\Models;

use App\Enums\RentalStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $staff_id
 * @property int|null $renter_id
 * @property string|null $renter_name
 * @property string $reference_number
 * @property Carbon $rented_at
 * @property Carbon|null $due_at
 * @property string $duration_type
 * @property int|null $duration_hours
 * @property Carbon|null $reserved_for
 * @property Carbon|null $returned_at
 * @property string $total_amount
 * @property RentalStatus $status
 * @property string|null $notes
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'staff_id',
    'renter_id',
    'renter_name',
    'reference_number',
    'rented_at',
    'due_at',
    'duration_type',
    'duration_hours',
    'reserved_for',
    'returned_at',
    'total_amount',
    'status',
    'notes',
])]
class RentalTransaction extends Model
{
    protected function casts(): array
    {
        return [
            'status' => RentalStatus::class,
            'total_amount' => 'decimal:2',
            'rented_at' => 'datetime',
            'due_at' => 'datetime',
            'reserved_for' => 'date',
            'returned_at' => 'datetime',
        ];
    }

    public function staff(): BelongsTo
    {
        return $this->belongsTo(User::class, 'staff_id');
    }

    public function renter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'renter_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(RentalTransactionItem::class);
    }
}
