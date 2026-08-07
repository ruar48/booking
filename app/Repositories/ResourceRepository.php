<?php

namespace App\Repositories;

use App\Contracts\Repositories\ResourceBookingRepositoryInterface;
use App\Contracts\Repositories\ResourceRepositoryInterface;
use App\Enums\ResourceStatus;
use App\Models\Resource;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;

class ResourceRepository implements ResourceRepositoryInterface
{
    public function __construct(
        private readonly ResourceBookingRepositoryInterface $resourceBookingRepository,
    ) {}

    public function paginate(int $perPage = 15): LengthAwarePaginator
    {
        return Resource::query()
            ->latest()
            ->paginate($perPage);
    }

    public function find(int $id): ?Resource
    {
        return Resource::query()->find($id);
    }

    public function create(array $data): Resource
    {
        return Resource::query()->create($data);
    }

    public function update(Resource $resource, array $data): Resource
    {
        $resource->update($data);

        return $resource->fresh();
    }

    public function delete(Resource $resource): bool
    {
        return (bool) $resource->delete();
    }

    public function getAvailableForSlot(
        int $resourceId,
        Carbon $startsAt,
        Carbon $endsAt,
        ?int $excludeBookingId = null,
    ): bool {
        $resource = $this->find($resourceId);

        if ($resource === null || $resource->status !== ResourceStatus::Available) {
            return false;
        }

        return $this->resourceBookingRepository
            ->getConflicts($resourceId, $startsAt, $endsAt, $excludeBookingId)
            ->isEmpty();
    }
}
