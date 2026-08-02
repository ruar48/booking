<?php

namespace App\Contracts\Repositories;

use App\Models\CourtBooking;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

interface CourtBookingRepositoryInterface
{
    public function paginate(int $perPage = 15): LengthAwarePaginator;

    public function paginateForUser(\App\Models\User $user, int $perPage = 15): LengthAwarePaginator;

    public function find(int $id): ?CourtBooking;

    public function create(array $data): CourtBooking;

    public function update(CourtBooking $booking, array $data): CourtBooking;

    public function delete(CourtBooking $booking): bool;

    public function getConflicts(
        int $courtId,
        Carbon $startsAt,
        Carbon $endsAt,
        ?int $excludeBookingId = null,
    ): Collection;

    public function getForCalendar(
        ?int $clubId = null,
        ?Carbon $start = null,
        ?Carbon $end = null,
    ): Collection;
}
