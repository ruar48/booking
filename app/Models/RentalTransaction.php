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
 * @property int $club_id
 * @property int $staff_id
 * @property int|null $renter_id
 * @property string|null $renter_name
 * @property string $reference_number
 * @property Carbon $rented_at
 * @property Carbon|null $due_at
 * @property Carbon|null $returned_at
 * @property string $deposit_amount
 * @property string $total_amount
 * @property RentalStatus $status
 * @property string|null $notes
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'club_id',
    'staff_id',
    'renter_id',
    'renter_name',
    'reference_number',
    'rented_at',
    'due_at',
    'returned_at',
    'deposit_amount',
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
            'deposit_amount' => 'decimal:2',
            'total_amount' => 'decimal:2',
            'rented_at' => 'datetime',
            'due_at' => 'datetime',
            'returned_at' => 'datetime',
        ];
    }

    public function club(): BelongsTo
    {
        return $this->belongsTo(Club::class);
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
