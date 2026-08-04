<?php

namespace App\Repositories;

use App\Contracts\Repositories\ClubRepositoryInterface;
use App\Models\Club;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class ClubRepository implements ClubRepositoryInterface
{
    public function paginate(int $perPage = 15): LengthAwarePaginator
    {
        return Club::query()
            ->latest()
            ->paginate($perPage);
    }

    public function find(int $id): ?Club
    {
        return Club::query()->find($id);
    }

    public function create(array $data): Club
    {
        return Club::query()->create($data);
    }

    public function update(Club $club, array $data): Club
    {
        $club->update($data);

        return $club->fresh();
    }

    public function delete(Club $club): bool
    {
        return (bool) $club->delete();
    }

    public function getWithCounts(): Collection
    {
        return Club::query()
            ->withCount(['resources', 'players', 'tournaments', 'coaches', 'announcements'])
            ->latest()
            ->get();
    }
}
