<?php

namespace App\Repositories;

use App\Contracts\Repositories\TournamentRepositoryInterface;
use App\Models\Tournament;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class TournamentRepository implements TournamentRepositoryInterface
{
    public function paginate(int $perPage = 15): LengthAwarePaginator
    {
        return Tournament::query()
            ->with('creator')
            ->latest('starts_at')
            ->paginate($perPage);
    }

    public function find(int $id): ?Tournament
    {
        return Tournament::query()->find($id);
    }

    public function create(array $data): Tournament
    {
        return Tournament::query()->create($data);
    }

    public function update(Tournament $tournament, array $data): Tournament
    {
        $tournament->update($data);

        return $tournament->fresh();
    }

    public function delete(Tournament $tournament): bool
    {
        return (bool) $tournament->delete();
    }
}
