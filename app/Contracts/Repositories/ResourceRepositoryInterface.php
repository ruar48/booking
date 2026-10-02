<?php

namespace App\Contracts\Repositories;

use App\Models\Resource;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;

interface ResourceRepositoryInterface
{
    public function paginate(int $perPage = 15): LengthAwarePaginator;

    /**
     * @param  array<string, mixed>  $filters
     */
    public function paginateFiltered(array $filters = [], int $perPage = 15): LengthAwarePaginator;

    /**
     * Venue-wide totals for the admin resources list, counted across every
     * resource (not one page) so they don't change while paging.
     *
     * @return array{total: int, by_sport: array<string, int>, available: int, min_rate: float}
     */
    public function stats(): array;

    public function find(int $id): ?Resource;

    public function create(array $data): Resource;

    public function update(Resource $resource, array $data): Resource;

    public function delete(Resource $resource): bool;

    public function getAvailableForSlot(
        int $resourceId,
        Carbon $startsAt,
        Carbon $endsAt,
        ?int $excludeBookingId = null,
    ): bool;
}
