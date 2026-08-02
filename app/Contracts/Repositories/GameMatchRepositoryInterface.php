<?php

namespace App\Contracts\Repositories;

use App\Models\GameMatch;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface GameMatchRepositoryInterface
{
    public function paginate(int $perPage = 15): LengthAwarePaginator;

    public function find(int $id): ?GameMatch;

    public function create(array $data): GameMatch;

    public function update(GameMatch $match, array $data): GameMatch;

    public function getRecent(int $limit = 10, ?int $clubId = null): Collection;
}
