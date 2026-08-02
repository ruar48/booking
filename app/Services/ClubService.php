<?php

namespace App\Services;

use App\Contracts\Repositories\ClubRepositoryInterface;
use App\Models\Club;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class ClubService
{
    public function __construct(
        private readonly ClubRepositoryInterface $clubRepository,
    ) {}

    public function paginate(int $perPage = 15): LengthAwarePaginator
    {
        return $this->clubRepository->paginate($perPage);
    }

    public function find(int $id): ?Club
    {
        return $this->clubRepository->find($id);
    }

    public function create(array $data): Club
    {
        return $this->clubRepository->create($data);
    }

    public function update(Club $club, array $data): Club
    {
        return $this->clubRepository->update($club, $data);
    }

    public function delete(Club $club): bool
    {
        return $this->clubRepository->delete($club);
    }

    public function getWithCounts(): Collection
    {
        return $this->clubRepository->getWithCounts();
    }
}
