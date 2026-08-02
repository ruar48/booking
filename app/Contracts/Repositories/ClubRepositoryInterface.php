<?php

namespace App\Contracts\Repositories;

use App\Models\Club;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface ClubRepositoryInterface
{
    public function paginate(int $perPage = 15): LengthAwarePaginator;

    public function find(int $id): ?Club;

    public function create(array $data): Club;

    public function update(Club $club, array $data): Club;

    public function delete(Club $club): bool;

    public function getWithCounts(): Collection;
}
