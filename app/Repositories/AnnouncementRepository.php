<?php

namespace App\Repositories;

use App\Contracts\Repositories\AnnouncementRepositoryInterface;
use App\Models\Announcement;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class AnnouncementRepository implements AnnouncementRepositoryInterface
{
    public function paginate(int $perPage = 15): LengthAwarePaginator
    {
        return Announcement::query()
            ->with(['creator'])
            ->latest('published_at')
            ->latest()
            ->paginate($perPage);
    }

    public function find(int $id): ?Announcement
    {
        return Announcement::query()->find($id);
    }

    public function create(array $data): Announcement
    {
        return Announcement::query()->create($data);
    }

    public function update(Announcement $announcement, array $data): Announcement
    {
        $announcement->update($data);

        return $announcement->fresh();
    }

    public function delete(Announcement $announcement): bool
    {
        return (bool) $announcement->delete();
    }

    public function getPublished(): Collection
    {
        return Announcement::query()
            ->with(['creator'])
            ->where('is_published', true)
            ->where(function ($query): void {
                $query->whereNull('published_at')
                    ->orWhere('published_at', '<=', now());
            })
            ->latest('published_at')
            ->get();
    }
}
