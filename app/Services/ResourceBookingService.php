<?php

namespace App\Services;

use App\Contracts\Repositories\ResourceBookingRepositoryInterface;
use App\Enums\BookingStatus;
use App\Events\BookingApproved;
use App\Events\BookingCancelled;
use App\Exceptions\BookingConflictException;
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
        $this->assertNoConflict(
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

        $this->assertNoConflict($resourceId, $startsAt, $endsAt, $booking->id);

        return $this->bookingRepository->update($booking, $data);
    }

    public function delete(ResourceBooking $booking): bool
    {
        return $this->bookingRepository->delete($booking);
    }

    public function approve(ResourceBooking $booking, User $approver): ResourceBooking
    {
        $this->assertNoConflict(
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

    public function getForCalendar(
        ?int $clubId = null,
        ?Carbon $start = null,
        ?Carbon $end = null,
    ): Collection {
        return $this->bookingRepository->getForCalendar($clubId, $start, $end);
    }

    private function assertNoConflict(
        int $resourceId,
        Carbon $startsAt,
        Carbon $endsAt,
        ?int $excludeBookingId = null,
    ): void {
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
