<?php

namespace App\Services;

use App\Contracts\Repositories\ResourceBookingRepositoryInterface;
use App\Enums\BookingStatus;
use App\Enums\ResourceStatus;
use App\Events\BookingApproved;
use App\Events\BookingCancelled;
use App\Exceptions\BookingConflictException;
use App\Models\RecurringScheduleLock;
use App\Models\Resource;
use App\Models\ResourceBooking;
use App\Models\ScheduleBlock;
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

    public function getForCalendar(
        ?int $clubId = null,
        ?Carbon $start = null,
        ?Carbon $end = null,
    ): Collection {
        return $this->bookingRepository->getForCalendar($clubId, $start, $end);
    }

    private function assertBookable(
        int $resourceId,
        Carbon $startsAt,
        Carbon $endsAt,
        ?int $excludeBookingId = null,
    ): void {
        $resource = Resource::query()->with('club')->find($resourceId);

        if ($resource === null || $resource->status !== ResourceStatus::Available) {
            throw new BookingConflictException('This court/table is currently unavailable.');
        }

        $isBlocked = ScheduleBlock::query()
            ->where('club_id', $resource->club_id)
            ->where(fn ($query) => $query
                ->whereNull('resource_id')
                ->orWhere('resource_id', $resourceId))
            ->where('starts_at', '<', $endsAt)
            ->where('ends_at', '>', $startsAt)
            ->exists();

        if ($isBlocked) {
            throw new BookingConflictException('This time slot is blocked.');
        }

        $isRecurringLocked = RecurringScheduleLock::query()
            ->where('club_id', $resource->club_id)
            ->where(fn ($query) => $query
                ->whereNull('resource_id')
                ->orWhere('resource_id', $resourceId))
            ->where('day_of_week', $startsAt->dayOfWeek)
            ->where('starts_at', '<', $endsAt->format('H:i:s'))
            ->where('ends_at', '>', $startsAt->format('H:i:s'))
            ->exists();

        if ($isRecurringLocked) {
            throw new BookingConflictException('This time slot is locked.');
        }

        $operatingHours = $resource->club?->operating_hours;

        if (! empty($operatingHours)) {
            $day = strtolower($startsAt->format('l'));
            $dayHours = $operatingHours[$day] ?? null;

            if ($dayHours !== null) {
                if (! empty($dayHours['closed'])) {
                    throw new BookingConflictException('This time is outside operating hours.');
                }

                $open = $dayHours['open'] ?? null;
                $close = $dayHours['close'] ?? null;

                if ($open && $close) {
                    $openAt = $startsAt->clone()->setTimeFromTimeString($open);
                    $closeAt = $startsAt->clone()->setTimeFromTimeString($close);

                    if ($startsAt->lt($openAt) || $endsAt->gt($closeAt)) {
                        throw new BookingConflictException('This time is outside operating hours.');
                    }
                }
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
