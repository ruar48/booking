<?php

namespace App\Contracts\Repositories;

use Illuminate\Support\Collection;

interface DashboardRepositoryInterface
{
    public function getStats(): array;

    public function getRecentMatches(int $limit = 10): Collection;

    public function getRankings(int $limit = 10): Collection;

    public function getUpcomingTournaments(int $limit = 10): Collection;

    public function getResourceAvailability(): Collection;

    public function getRevenueChart(): array;

    public function getMatchStats(): array;

    public function getBookingStatusBreakdown(): array;

    public function getRecentBookings(int $limit = 8): Collection;

    public function getUpcomingOpenPlay(int $limit = 6): Collection;
}
