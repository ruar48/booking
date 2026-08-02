<?php

namespace App\Contracts\Repositories;

use Illuminate\Support\Collection;

interface DashboardRepositoryInterface
{
    public function getStats(?int $clubId = null): array;

    public function getRecentMatches(?int $clubId = null, int $limit = 10): Collection;

    public function getRankings(?int $clubId = null, int $limit = 10): Collection;

    public function getUpcomingTournaments(?int $clubId = null, int $limit = 10): Collection;

    public function getCourtAvailability(?int $clubId = null): Collection;

    public function getRevenueChart(?int $clubId = null): array;

    public function getMatchStats(?int $clubId = null): array;

    public function getRecentBookings(?int $clubId = null, int $limit = 8): Collection;

    public function getUpcomingOpenPlay(?int $clubId = null, int $limit = 6): Collection;
}
