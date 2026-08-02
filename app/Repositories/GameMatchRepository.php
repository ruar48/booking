<?php

namespace App\Repositories;

use App\Contracts\Repositories\GameMatchRepositoryInterface;
use App\Models\GameMatch;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class GameMatchRepository implements GameMatchRepositoryInterface
{
    public function paginate(int $perPage = 15): LengthAwarePaginator
    {
        return GameMatch::query()
            ->with(['tournament', 'court', 'player1.user', 'player2.user', 'winner'])
            ->latest('scheduled_at')
            ->paginate($perPage);
    }

    public function find(int $id): ?GameMatch
    {
        return GameMatch::query()->find($id);
    }

    public function create(array $data): GameMatch
    {
        return GameMatch::query()->create($data);
    }

    public function update(GameMatch $match, array $data): GameMatch
    {
        $match->update($data);

        return $match->fresh();
    }

    public function getRecent(int $limit = 10, ?int $clubId = null): Collection
    {
        return GameMatch::query()
            ->with(['tournament', 'court', 'player1.user', 'player2.user', 'winner'])
            ->when(
                $clubId !== null,
                fn ($query) => $query->whereHas(
                    'court',
                    fn ($query) => $query->where('club_id', $clubId),
                ),
            )
            ->latest('completed_at')
            ->latest('scheduled_at')
            ->limit($limit)
            ->get();
    }
}
