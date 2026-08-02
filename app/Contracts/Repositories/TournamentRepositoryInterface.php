<?php

namespace App\Contracts\Repositories;

use App\Models\Tournament;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface TournamentRepositoryInterface
{
    public function paginate(int $perPage = 15): LengthAwarePaginator;

    public function find(int $id): ?Tournament;

    public function create(array $data): Tournament;

    public function update(Tournament $tournament, array $data): Tournament;

    public function delete(Tournament $tournament): bool;
}
