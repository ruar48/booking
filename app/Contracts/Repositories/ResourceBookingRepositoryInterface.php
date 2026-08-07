<?php

namespace App\Contracts\Repositories;

use App\Models\ResourceBooking;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

interface ResourceBookingRepositoryInterface
{
    public function paginate(int $perPage = 15): LengthAwarePaginator;

    public function paginateForUser(\App\Models\User $user, int $perPage = 15): LengthAwarePaginator;

    public function find(int $id): ?ResourceBooking;

    public function create(array $data): ResourceBooking;

    public function update(ResourceBooking $booking, array $data): ResourceBooking;

    public function delete(ResourceBooking $booking): bool;

    public function getConflicts(
        int $resourceId,
        Carbon $startsAt,
        Carbon $endsAt,
        ?int $excludeBookingId = null,
    ): Collection;

    public function getForCalendar(
        ?Carbon $start = null,
        ?Carbon $end = null,
    ): Collection;
}
