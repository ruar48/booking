<?php

namespace App\Contracts\Repositories;

use App\Models\Player;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface PlayerRepositoryInterface
{
    /**
     * @param  array{search?: string, club_id?: int, experience_level?: string}  $filters
     */
    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator;

    public function findWithRelations(int $id, array $relations = []): ?Player;

    public function create(array $data): Player;

    public function update(Player $player, array $data): Player;

    public function delete(Player $player): bool;
}
