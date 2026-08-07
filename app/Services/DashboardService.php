<?php

namespace App\Services;

use App\Contracts\Repositories\AnnouncementRepositoryInterface;
use App\Contracts\Repositories\DashboardRepositoryInterface;

class DashboardService
{
    public function __construct(
        private readonly DashboardRepositoryInterface $dashboardRepository,
        private readonly AnnouncementRepositoryInterface $announcementRepository,
    ) {}

    public function getData(): array
    {
        return [
            'stats' => $this->dashboardRepository->getStats(),
            'resourceAvailability' => $this->dashboardRepository->getResourceAvailability(),
            'revenueChart' => $this->dashboardRepository->getRevenueChart(),
            'recentBookings' => $this->dashboardRepository->getRecentBookings(),
            'announcements' => $this->announcementRepository->getPublished()
                ->filter(fn ($announcement) => $announcement->show_on_dashboard)
                ->take(5)
                ->values(),
        ];
    }
}
