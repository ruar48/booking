<?php

namespace App\Services;

use App\Contracts\Repositories\AnnouncementRepositoryInterface;
use App\Contracts\Repositories\DashboardRepositoryInterface;
use App\Models\Club;

class DashboardService
{
    public function __construct(
        private readonly DashboardRepositoryInterface $dashboardRepository,
        private readonly AnnouncementRepositoryInterface $announcementRepository,
    ) {}

    public function getData(?int $clubId = null): array
    {
        $clubId ??= Club::query()->where('is_active', true)->oldest()->value('id');

        return [
            'stats' => $this->dashboardRepository->getStats($clubId),
            'resourceAvailability' => $this->dashboardRepository->getResourceAvailability($clubId),
            'revenueChart' => $this->dashboardRepository->getRevenueChart($clubId),
            'recentBookings' => $this->dashboardRepository->getRecentBookings($clubId),
            'openPlaySessions' => $this->dashboardRepository->getUpcomingOpenPlay($clubId),
            'announcements' => $this->announcementRepository->getPublished()
                ->filter(fn ($announcement) => $announcement->show_on_dashboard)
                ->take(5)
                ->values(),
        ];
    }
}
