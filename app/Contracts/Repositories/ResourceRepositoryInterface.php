<?php

namespace App\Contracts\Repositories;

use App\Models\Resource;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;

interface ResourceRepositoryInterface
{
    public function paginate(int $perPage = 15): LengthAwarePaginator;

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
