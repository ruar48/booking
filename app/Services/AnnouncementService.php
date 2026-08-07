<?php

namespace App\Services;

use App\Contracts\Repositories\AnnouncementRepositoryInterface;
use App\Events\AnnouncementPublished;
use App\Models\Announcement;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class AnnouncementService
{
    public function __construct(
        private readonly AnnouncementRepositoryInterface $announcementRepository,
    ) {}

    public function paginate(int $perPage = 15): LengthAwarePaginator
    {
        return $this->announcementRepository->paginate($perPage);
    }

    public function find(int $id): ?Announcement
    {
        return $this->announcementRepository->find($id);
    }

    public function create(array $data): Announcement
    {
        $announcement = $this->announcementRepository->create($data);

        if ($announcement->is_published) {
            event(new AnnouncementPublished($announcement));
        }

        return $announcement;
    }

    public function update(Announcement $announcement, array $data): Announcement
    {
        $wasPublished = $announcement->is_published;

        $announcement = $this->announcementRepository->update($announcement, $data);

        if (! $wasPublished && $announcement->is_published) {
            event(new AnnouncementPublished($announcement));
        }

        return $announcement;
    }

    public function delete(Announcement $announcement): bool
    {
        return $this->announcementRepository->delete($announcement);
    }

    public function getPublished(): Collection
    {
        return $this->announcementRepository->getPublished();
    }
}
