<?php

namespace App\Repositories;

use App\Contracts\Repositories\ResourceBookingRepositoryInterface;
use App\Enums\BookingStatus;
use App\Models\ResourceBooking;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class ResourceBookingRepository implements ResourceBookingRepositoryInterface
{
    /** @var list<BookingStatus> */
    private const BLOCKING_STATUSES = [
        BookingStatus::Pending,
        BookingStatus::Approved,
        BookingStatus::Completed,
    ];

    public function paginate(int $perPage = 15): LengthAwarePaginator
    {
        return ResourceBooking::query()
            ->with(['resource', 'user', 'approver'])
            ->latest('starts_at')
            ->paginate($perPage);
    }

    public function paginateForUser(User $user, int $perPage = 15): LengthAwarePaginator
    {
        return ResourceBooking::query()
            ->with(['resource', 'user', 'approver'])
            ->when(
                ! $user->isVenueAdmin(),
                fn ($query) => $query->where('user_id', $user->id),
            )
            ->latest('starts_at')
            ->paginate($perPage);
    }

    public function find(int $id): ?ResourceBooking
    {
        return ResourceBooking::query()->find($id);
    }

    public function create(array $data): ResourceBooking
    {
        return ResourceBooking::query()->create($data);
    }

    public function update(ResourceBooking $booking, array $data): ResourceBooking
    {
        $booking->update($data);

        return $booking->fresh();
    }

    public function delete(ResourceBooking $booking): bool
    {
        return (bool) $booking->delete();
    }

    public function getConflicts(
        int $resourceId,
        Carbon $startsAt,
        Carbon $endsAt,
        ?int $excludeBookingId = null,
    ): Collection {
        return ResourceBooking::query()
            ->where('resource_id', $resourceId)
            ->whereIn('status', self::BLOCKING_STATUSES)
            ->when(
                $excludeBookingId !== null,
                fn ($query) => $query->where('id', '!=', $excludeBookingId),
            )
            ->where('starts_at', '<', $endsAt)
            ->where('ends_at', '>', $startsAt)
            ->get();
    }

    public function getForCalendar(
        ?Carbon $start = null,
        ?Carbon $end = null,
    ): Collection {
        $start ??= now()->startOfMonth();
        $end ??= now()->endOfMonth();

        return ResourceBooking::query()
            ->with(['resource', 'user'])
            ->where('starts_at', '<', $end)
            ->where('ends_at', '>', $start)
            ->orderBy('starts_at')
            ->get();
    }
}
