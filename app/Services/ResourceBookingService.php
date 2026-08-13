<?php

namespace App\Services;

use App\Contracts\Repositories\ResourceBookingRepositoryInterface;
use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Enums\ResourceStatus;
use App\Events\BookingApproved;
use App\Events\BookingCancelled;
use App\Exceptions\BookingConflictException;
use App\Models\DateOverride;
use App\Models\Resource;
use App\Models\ResourceBooking;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ResourceBookingService
{
    public function __construct(
        private readonly ResourceBookingRepositoryInterface $bookingRepository,
    ) {}

    public function paginate(int $perPage = 15): LengthAwarePaginator
    {
        return $this->bookingRepository->paginate($perPage);
    }

    public function find(int $id): ?ResourceBooking
    {
        return $this->bookingRepository->find($id);
    }

    public function create(array $data): ResourceBooking
    {
        $this->assertBookable(
            $data['resource_id'],
            Carbon::parse($data['starts_at']),
            Carbon::parse($data['ends_at']),
        );

        return $this->bookingRepository->create($data);
    }

    public function update(ResourceBooking $booking, array $data): ResourceBooking
    {
        $resourceId = $data['resource_id'] ?? $booking->resource_id;
        $startsAt = isset($data['starts_at'])
            ? Carbon::parse($data['starts_at'])
            : $booking->starts_at;
        $endsAt = isset($data['ends_at'])
            ? Carbon::parse($data['ends_at'])
            : $booking->ends_at;

        $this->assertBookable($resourceId, $startsAt, $endsAt, $booking->id);

        return $this->bookingRepository->update($booking, $data);
    }

    public function delete(ResourceBooking $booking): bool
    {
        return $this->bookingRepository->delete($booking);
    }

    public function approve(ResourceBooking $booking, User $approver): ResourceBooking
    {
        $this->assertBookable(
            $booking->resource_id,
            $booking->starts_at,
            $booking->ends_at,
            $booking->id,
        );

        $booking = DB::transaction(function () use ($booking, $approver): ResourceBooking {
            return $this->bookingRepository->update($booking, [
                'status' => BookingStatus::Approved,
                'approved_by' => $approver->id,
            ]);
        });

        event(new BookingApproved($booking));

        return $booking;
    }

    public function reject(ResourceBooking $booking, ?string $reason = null): ResourceBooking
    {
        return $this->bookingRepository->update($booking, [
            'status' => BookingStatus::Rejected,
            'cancellation_reason' => $reason,
        ]);
    }

    public function cancel(ResourceBooking $booking, ?string $reason = null): ResourceBooking
    {
        $booking = $this->bookingRepository->update($booking, [
            'status' => BookingStatus::Cancelled,
            'cancellation_reason' => $reason,
        ]);

        event(new BookingCancelled($booking));

        return $booking;
    }

    /**
     * Cancel a booking together with every sibling from the same bulk
     * submission (see ResourceBooking::groupBookings()), so a customer
     * cancelling one part of a multi-slot booking doesn't leave the rest
     * dangling as Pending/still holding the court. Already-cancelled
     * siblings are left alone. Returns the cancelled version of $booking.
     */
    public function cancelGroup(ResourceBooking $booking, ?string $reason = null): ResourceBooking
    {
        $cancelled = null;

        foreach ($booking->groupBookings() as $sibling) {
            if ($sibling->status === BookingStatus::Cancelled) {
                continue;
            }

            $result = $this->cancel($sibling, $reason);

            if ($sibling->id === $booking->id) {
                $cancelled = $result;
            }
        }

        return $cancelled ?? $booking->fresh();
    }

    /**
     * Mark a booking together with every sibling from the same bulk
     * submission as paid, since a single QR payment covers the whole group
     * (see ResourceBookingController::checkout()). Siblings already paid are
     * left alone.
     */
    public function markGroupPaid(ResourceBooking $booking): void
    {
        foreach ($booking->groupBookings() as $sibling) {
            if ($sibling->payment_status === PaymentStatus::Paid) {
                continue;
            }

            $updates = ['payment_status' => PaymentStatus::Paid];

            if ($sibling->status === BookingStatus::Pending) {
                $updates['status'] = BookingStatus::Approved;
            }

            $this->bookingRepository->update($sibling, $updates);
        }
    }

    public function getForCalendar(
        ?Carbon $start = null,
        ?Carbon $end = null,
    ): Collection {
        return $this->bookingRepository->getForCalendar($start, $end);
    }

    private function assertBookable(
        int $resourceId,
        Carbon $startsAt,
        Carbon $endsAt,
        ?int $excludeBookingId = null,
    ): void {
        $resource = Resource::query()->find($resourceId);

        if ($resource === null || $resource->status !== ResourceStatus::Available) {
            throw new BookingConflictException('This court/table is currently unavailable.');
        }

        // Dates are closed for booking by default: a resource can only be booked
        // on a date an admin has explicitly opened (with hours) via the booking
        // calendar. Absence of a DateOverride row means the date is closed.
        $dateOverride = DateOverride::query()
            ->whereDate('date', $startsAt->toDateString())
            ->first();

        if ($dateOverride === null || $dateOverride->is_closed) {
            throw new BookingConflictException('This date is closed for bookings.');
        }

        if ($dateOverride->open_time && $dateOverride->close_time) {
            $openAt = $startsAt->clone()->setTimeFromTimeString($dateOverride->open_time);
            $closeAt = $startsAt->clone()->setTimeFromTimeString($dateOverride->close_time);

            if ($startsAt->lt($openAt) || $endsAt->gt($closeAt)) {
                throw new BookingConflictException('This time is outside operating hours.');
            }
        }

        $conflicts = $this->bookingRepository->getConflicts(
            $resourceId,
            $startsAt,
            $endsAt,
            $excludeBookingId,
        );

        if ($conflicts->isNotEmpty()) {
            throw new BookingConflictException;
        }
    }
}
