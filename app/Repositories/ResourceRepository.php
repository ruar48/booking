<?php

namespace App\Repositories;

use App\Contracts\Repositories\ResourceBookingRepositoryInterface;
use App\Contracts\Repositories\ResourceRepositoryInterface;
use App\Enums\ResourceStatus;
use App\Enums\Sport;
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

    /**
     * Sortable columns, whitelisted so a request cannot order by an arbitrary
     * column.
     *
     * @var list<string>
     */
    private const SORTABLE = ['name', 'sport', 'location_type', 'hourly_rate', 'status'];

    /**
     * @param  array<string, mixed>  $filters
     */
    public function paginateFiltered(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $sort = in_array($filters['sort'] ?? null, self::SORTABLE, true)
            ? $filters['sort']
            : null;

        $direction = ($filters['direction'] ?? 'asc') === 'desc' ? 'desc' : 'asc';

        return Resource::query()
            ->when(
                ! empty($filters['search']),
                fn ($query) => $query->where('name', 'like', '%'.$filters['search'].'%'),
            )
            ->when(
                ! empty($filters['sport']),
                fn ($query) => $query->where('sport', $filters['sport']),
            )
            ->when(
                ! empty($filters['status']),
                fn ($query) => $query->where('status', $filters['status']),
            )
            ->when(
                $sort !== null,
                fn ($query) => $query->orderBy($sort, $direction),
                fn ($query) => $query->orderBy('sport')->orderBy('resource_number'),
            )
            ->paginate($perPage)
            ->withQueryString();
    }

    /**
     * @return array{total: int, by_sport: array<string, int>, available: int, min_rate: float}
     */
    public function stats(): array
    {
        $counts = Resource::query()
            ->selectRaw('sport, count(*) as aggregate')
            ->groupBy('sport')
            ->pluck('aggregate', 'sport');

        // Every sport is present (zero when it has no resources), in enum order.
        $bySport = [];
        foreach (Sport::cases() as $sport) {
            $bySport[$sport->value] = (int) ($counts[$sport->value] ?? 0);
        }

        return [
            'total' => Resource::query()->count(),
            'by_sport' => $bySport,
            'available' => Resource::query()->where('status', ResourceStatus::Available)->count(),
            'min_rate' => (float) (Resource::query()->min('hourly_rate') ?? 0),
        ];
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
