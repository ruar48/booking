<?php

namespace App\Repositories;

use App\Contracts\Repositories\ResourceBookingRepositoryInterface;
use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Models\ResourceBooking;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class ResourceBookingRepository implements ResourceBookingRepositoryInterface
{
    /** @var list<BookingStatus> */
    public const BLOCKING_STATUSES = [
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

    public function statsForUser(User $user): array
    {
        $base = fn () => ResourceBooking::query()->where('user_id', $user->id);

        return [
            'upcoming' => $base()
                ->where('starts_at', '>=', now())
                ->whereIn('status', [BookingStatus::Pending, BookingStatus::Approved])
                ->count(),
            'total' => $base()->count(),
            'unpaid' => (float) $base()->where('payment_status', 'unpaid')->sum('amount'),
            'unpaid_count' => $base()->where('payment_status', 'unpaid')->count(),
            'paid' => (float) $base()->where('payment_status', 'paid')->sum('amount'),
            'paid_count' => $base()->where('payment_status', 'paid')->count(),
            'trends' => $this->statTrendsForUser($user),
        ];
    }

    /**
     * Per-month history behind the member stat cards' sparklines, oldest
     * bucket first. Aggregated in PHP rather than with a SQL date function so
     * the same code works on SQLite (tests) and MySQL alike.
     *
     * @return array{upcoming: list<int>, total: list<int>, unpaid: list<float>, paid: list<float>}
     */
    protected function statTrendsForUser(User $user, int $months = 6): array
    {
        $start = now()->startOfMonth()->subMonths($months - 1);

        /** @var array<string, array{count: int, unpaid: float, paid: float}> $buckets */
        $buckets = [];

        for ($i = 0; $i < $months; $i++) {
            $buckets[$start->clone()->addMonths($i)->format('Y-m')] = [
                'count' => 0,
                'unpaid' => 0.0,
                'paid' => 0.0,
            ];
        }

        $bookings = ResourceBooking::query()
            ->where('user_id', $user->id)
            ->where('starts_at', '>=', $start)
            ->get(['starts_at', 'amount', 'payment_status']);

        foreach ($bookings as $booking) {
            $key = $booking->starts_at->format('Y-m');

            // Bookings scheduled past the window still come back from the
            // query above; they belong to no bucket.
            if (! isset($buckets[$key])) {
                continue;
            }

            $buckets[$key]['count']++;

            if ($booking->payment_status === PaymentStatus::Unpaid) {
                $buckets[$key]['unpaid'] += (float) $booking->amount;
            } elseif ($booking->payment_status === PaymentStatus::Paid) {
                $buckets[$key]['paid'] += (float) $booking->amount;
            }
        }

        $counts = array_values(array_map(fn (array $bucket) => $bucket['count'], $buckets));

        // "Total bookings" reads as growth over time, so its sparkline is the
        // running total rather than the per-month count.
        $running = 0;
        $cumulative = array_map(fn (int $count) => $running += $count, $counts);

        return [
            'upcoming' => $counts,
            'total' => $cumulative,
            'unpaid' => array_values(array_map(fn (array $bucket) => round($bucket['unpaid'], 2), $buckets)),
            'paid' => array_values(array_map(fn (array $bucket) => round($bucket['paid'], 2), $buckets)),
        ];
    }

    public function nextBookingForUser(User $user): ?ResourceBooking
    {
        return ResourceBooking::query()
            ->where('user_id', $user->id)
            ->where('starts_at', '>=', now())
            ->whereIn('status', [BookingStatus::Pending, BookingStatus::Approved])
            ->with('resource')
            ->orderBy('starts_at')
            ->first();
    }
}
