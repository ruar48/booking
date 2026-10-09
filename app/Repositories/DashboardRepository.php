<?php

namespace App\Repositories;

use App\Contracts\Repositories\DashboardRepositoryInterface;
use App\Enums\BookingStatus;
use App\Enums\MatchStatus;
use App\Enums\PaymentStatus;
use App\Enums\TournamentStatus;
use App\Models\GameMatch;
use App\Models\OpenPlaySession;
use App\Models\Player;
use App\Models\Ranking;
use App\Models\Resource;
use App\Models\ResourceBooking;
use App\Models\Tournament;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class DashboardRepository implements DashboardRepositoryInterface
{
    public function getStats(): array
    {
        $playersQuery = Player::query();

        $resourcesQuery = Resource::query();

        $bookingsQuery = ResourceBooking::query();

        $tournamentsQuery = Tournament::query();

        $matchesQuery = GameMatch::query();

        return [
            'players' => (clone $playersQuery)->count(),
            'active_players' => (clone $playersQuery)->where('is_active', true)->count(),
            'courts' => (clone $resourcesQuery)->count(),
            'bookings_today' => (clone $bookingsQuery)
                ->whereDate('starts_at', today())
                ->whereIn('status', [BookingStatus::Pending, BookingStatus::Approved])
                ->count(),
            'pending_bookings' => (clone $bookingsQuery)
                ->where('status', BookingStatus::Approved)
                ->where('payment_status', PaymentStatus::Unpaid)
                ->count(),
            'upcoming_tournaments' => (clone $tournamentsQuery)
                ->where('starts_at', '>', now())
                ->whereNotIn('status', [TournamentStatus::Completed, TournamentStatus::Cancelled])
                ->count(),
            'matches_scheduled' => (clone $matchesQuery)
                ->where('status', MatchStatus::Scheduled)
                ->count(),
            'bookings_yesterday' => (clone $bookingsQuery)
                ->whereDate('starts_at', today()->subDay())
                ->whereIn('status', [BookingStatus::Pending, BookingStatus::Approved, BookingStatus::Completed])
                ->count(),
            'bookings_this_month' => (clone $bookingsQuery)
                ->whereMonth('starts_at', now()->month)
                ->whereYear('starts_at', now()->year)
                ->count(),
            'members_new_this_week' => (clone $playersQuery)
                ->where('created_at', '>=', now()->startOfWeek())
                ->count(),
            'courts_available' => (clone $resourcesQuery)->where('status', 'available')->count(),
        ];
    }

    public function getBookingStatusBreakdown(): array
    {
        $counts = ResourceBooking::query()
            ->whereMonth('starts_at', now()->month)
            ->whereYear('starts_at', now()->year)
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status');

        return collect(BookingStatus::cases())
            ->map(fn (BookingStatus $status) => [
                'status' => $status->value,
                'count' => (int) ($counts[$status->value] ?? 0),
            ])
            ->filter(fn (array $row) => $row['count'] > 0)
            ->values()
            ->all();
    }

    public function getRecentMatches(int $limit = 10): Collection
    {
        return GameMatch::query()
            ->with(['tournament', 'court', 'player1.user', 'player2.user', 'winner'])
            ->whereIn('status', [MatchStatus::Completed, MatchStatus::InProgress])
            ->latest('completed_at')
            ->latest('scheduled_at')
            ->limit($limit)
            ->get();
    }

    public function getRankings(int $limit = 10): Collection
    {
        return Ranking::query()
            ->with('player.user')
            ->orderByDesc('elo_rating')
            ->limit($limit)
            ->get();
    }

    public function getUpcomingTournaments(int $limit = 10): Collection
    {
        return Tournament::query()
            ->with('creator')
            ->where('starts_at', '>', now())
            ->whereNotIn('status', [TournamentStatus::Completed, TournamentStatus::Cancelled])
            ->orderBy('starts_at')
            ->limit($limit)
            ->get();
    }

    public function getResourceAvailability(): Collection
    {
        return Resource::query()
            ->with([
                'bookings' => fn ($query) => $query
                    ->whereDate('starts_at', today())
                    ->whereIn('status', [BookingStatus::Pending, BookingStatus::Approved])
                    ->orderBy('starts_at'),
            ])
            ->orderBy('resource_number')
            ->get();
    }

    public function getMatchStats(): array
    {
        $query = GameMatch::query();

        return [
            'scheduled' => (clone $query)->where('status', MatchStatus::Scheduled)->count(),
            'in_progress' => (clone $query)->where('status', MatchStatus::InProgress)->count(),
            'completed' => (clone $query)->where('status', MatchStatus::Completed)->count(),
            'cancelled' => (clone $query)->where('status', MatchStatus::Cancelled)->count(),
            'total' => (clone $query)->count(),
        ];
    }

    public function getRecentBookings(int $limit = 8): Collection
    {
        return ResourceBooking::query()
            ->with(['resource', 'user'])
            ->latest('starts_at')
            ->limit($limit)
            ->get();
    }

    public function getUpcomingOpenPlay(int $limit = 6): Collection
    {
        return OpenPlaySession::query()
            ->where('starts_at', '>=', now())
            ->orderBy('starts_at')
            ->limit($limit)
            ->get();
    }
}
