<?php

namespace App\Models;

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use Database\Factories\ResourceBookingFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string|null $booking_group_id
 * @property int|null $rescheduled_from_id
 * @property int $resource_id
 * @property int $user_id
 * @property int|null $created_by
 * @property int|null $approved_by
 * @property Carbon $starts_at
 * @property Carbon $ends_at
 * @property BookingStatus $status
 * @property PaymentStatus $payment_status
 * @property string $amount
 * @property string|null $notes
 * @property string|null $cancellation_reason
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 */
#[Fillable([
    'booking_group_id',
    'rescheduled_from_id',
    'resource_id',
    'user_id',
    'created_by',
    'approved_by',
    'starts_at',
    'ends_at',
    'status',
    'payment_status',
    'amount',
    'notes',
    'cancellation_reason',
])]
class ResourceBooking extends Model
{
    /** @use HasFactory<ResourceBookingFactory> */
    use HasFactory, SoftDeletes;

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'status' => BookingStatus::class,
            'payment_status' => PaymentStatus::class,
            'amount' => 'decimal:2',
        ];
    }

    public function resource(): BelongsTo
    {
        return $this->belongsTo(Resource::class, 'resource_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function rescheduledFrom(): BelongsTo
    {
        return $this->belongsTo(static::class, 'rescheduled_from_id');
    }

    /**
     * @return MorphMany<Payment, $this>
     */
    public function payments(): MorphMany
    {
        return $this->morphMany(Payment::class, 'payable');
    }

    /**
     * All bookings created together in the same bulk submission (e.g. a
     * multi-hour or multi-court selection on the calendar), including this
     * one — so checkout/payment can operate on the whole batch instead of
     * silently acting on just this single row. Bookings without a group
     * (single/legacy submissions) return a collection of just themselves.
     *
     * @return Collection<int, static>
     */
    public function groupBookings(): Collection
    {
        if (! $this->booking_group_id) {
            return new Collection([$this]);
        }

        return static::query()
            ->where('booking_group_id', $this->booking_group_id)
            ->orderBy('starts_at')
            ->get();
    }
}
