<?php

namespace App\Contracts\Repositories;

use App\Models\Court;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;

interface CourtRepositoryInterface
{
    public function paginate(int $perPage = 15): LengthAwarePaginator;

    public function find(int $id): ?Court;

    public function create(array $data): Court;

    public function update(Court $court, array $data): Court;

    public function delete(Court $court): bool;

    public function getAvailableForSlot(
        int $courtId,
        Carbon $startsAt,
        Carbon $endsAt,
        ?int $excludeBookingId = null,
    ): bool;
}
