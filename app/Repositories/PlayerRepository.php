<?php

namespace App\Repositories;

use App\Contracts\Repositories\PlayerRepositoryInterface;
use App\Models\Player;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class PlayerRepository implements PlayerRepositoryInterface
{
    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        return Player::query()
            ->with(['user'])
            ->when(
                filled($filters['search'] ?? null),
                fn ($query) => $query->where(function ($query) use ($filters): void {
                    $search = $filters['search'];

                    $query->whereHas('user', function ($query) use ($search): void {
                        $query->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    })->orWhere('phone', 'like', "%{$search}%");
                }),
            )
            ->when(
                filled($filters['experience_level'] ?? null),
                fn ($query) => $query->where('experience_level', $filters['experience_level']),
            )
            ->latest()
            ->paginate($perPage);
    }

    public function findWithRelations(int $id, array $relations = []): ?Player
    {
        $defaultRelations = ['user', 'achievements', 'rankings', 'coaches'];

        return Player::query()
            ->with($relations ?: $defaultRelations)
            ->find($id);
    }

    public function create(array $data): Player
    {
        return Player::query()->create($data);
    }

    public function update(Player $player, array $data): Player
    {
        $player->update($data);

        return $player->fresh();
    }

    public function delete(Player $player): bool
    {
        return (bool) $player->delete();
    }
}
