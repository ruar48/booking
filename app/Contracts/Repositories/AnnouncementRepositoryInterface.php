<?php

namespace App\Contracts\Repositories;

use App\Models\Announcement;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface AnnouncementRepositoryInterface
{
    public function paginate(int $perPage = 15): LengthAwarePaginator;

    public function find(int $id): ?Announcement;

    public function create(array $data): Announcement;

    public function update(Announcement $announcement, array $data): Announcement;

    public function delete(Announcement $announcement): bool;

    public function getPublished(): Collection;
}
