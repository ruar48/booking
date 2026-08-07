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

    public function paginateForUser(User $user, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        return ResourceBooking::query()
            ->with(['resource', 'user', 'approver'])
            ->when(
                ! $user->isVenueAdmin(),
                fn ($query) => $query->where('user_id', $user->id),
            )
            ->when(
                ! empty($filters['search']),
                fn ($query) => $query->whereHas(
                    'user',
                    fn ($userQuery) => $userQuery->where('name', 'like', '%'.$filters['search'].'%'),
                ),
            )
            ->when(
                ! empty($filters['status']),
                fn ($query) => $query->where('status', $filters['status']),
            )
            ->when(
                ! empty($filters['payment_status']),
                fn ($query) => $query->where('payment_status', $filters['payment_status']),
            )
            ->when(
                ! empty($filters['resource_id']),
                fn ($query) => $query->where('resource_id', $filters['resource_id']),
            )
            ->when(
                ! empty($filters['date']),
                fn ($query) => $query->whereDate('starts_at', $filters['date']),
            )
            ->latest('starts_at')
            ->paginate($perPage)
            ->withQueryString();
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
