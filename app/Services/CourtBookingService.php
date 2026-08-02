<?php

namespace App\Services;

use App\Contracts\Repositories\CourtBookingRepositoryInterface;
use App\Enums\BookingStatus;
use App\Events\BookingApproved;
use App\Events\BookingCancelled;
use App\Exceptions\BookingConflictException;
use App\Models\CourtBooking;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class CourtBookingService
{
    public function __construct(
        private readonly CourtBookingRepositoryInterface $bookingRepository,
    ) {}

    public function paginate(int $perPage = 15): LengthAwarePaginator
    {
        return $this->bookingRepository->paginate($perPage);
    }

    public function find(int $id): ?CourtBooking
    {
        return $this->bookingRepository->find($id);
    }

    public function create(array $data): CourtBooking
    {
        $this->assertNoConflict(
            $data['court_id'],
            Carbon::parse($data['starts_at']),
            Carbon::parse($data['ends_at']),
        );

        return $this->bookingRepository->create($data);
    }

    public function update(CourtBooking $booking, array $data): CourtBooking
    {
        $courtId = $data['court_id'] ?? $booking->court_id;
        $startsAt = isset($data['starts_at'])
            ? Carbon::parse($data['starts_at'])
            : $booking->starts_at;
        $endsAt = isset($data['ends_at'])
            ? Carbon::parse($data['ends_at'])
            : $booking->ends_at;

        $this->assertNoConflict($courtId, $startsAt, $endsAt, $booking->id);

        return $this->bookingRepository->update($booking, $data);
    }

    public function delete(CourtBooking $booking): bool
    {
        return $this->bookingRepository->delete($booking);
    }

    public function approve(CourtBooking $booking, User $approver): CourtBooking
    {
        $this->assertNoConflict(
            $booking->court_id,
            $booking->starts_at,
            $booking->ends_at,
            $booking->id,
        );

        $booking = DB::transaction(function () use ($booking, $approver): CourtBooking {
            return $this->bookingRepository->update($booking, [
                'status' => BookingStatus::Approved,
                'approved_by' => $approver->id,
            ]);
        });

        event(new BookingApproved($booking));

        return $booking;
    }

    public function reject(CourtBooking $booking, ?string $reason = null): CourtBooking
    {
        return $this->bookingRepository->update($booking, [
            'status' => BookingStatus::Rejected,
            'cancellation_reason' => $reason,
        ]);
    }

    public function cancel(CourtBooking $booking, ?string $reason = null): CourtBooking
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
        int $courtId,
        Carbon $startsAt,
        Carbon $endsAt,
        ?int $excludeBookingId = null,
    ): void {
        $conflicts = $this->bookingRepository->getConflicts(
            $courtId,
            $startsAt,
            $endsAt,
            $excludeBookingId,
        );

        if ($conflicts->isNotEmpty()) {
            throw new BookingConflictException;
        }
    }
}
