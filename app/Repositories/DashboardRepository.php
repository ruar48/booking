<?php

namespace App\Repositories;

use App\Contracts\Repositories\DashboardRepositoryInterface;
use App\Enums\BookingStatus;
use App\Enums\MatchStatus;
use App\Enums\PaymentStatus;
use App\Enums\TournamentStatus;
use App\Models\ClubEvent;
use App\Models\Court;
use App\Models\CourtBooking;
use App\Models\GameMatch;
use App\Models\Player;
use App\Models\Ranking;
use App\Models\Tournament;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class DashboardRepository implements DashboardRepositoryInterface
{
    public function getStats(?int $clubId = null): array
    {
        $playersQuery = Player::query()->when(
            $clubId !== null,
            fn ($query) => $query->where('club_id', $clubId),
        );

        $courtsQuery = Court::query()->when(
            $clubId !== null,
            fn ($query) => $query->where('club_id', $clubId),
        );

        $bookingsQuery = CourtBooking::query()
            ->when(
                $clubId !== null,
                fn ($query) => $query->whereHas(
                    'court',
                    fn ($query) => $query->where('club_id', $clubId),
                ),
            );

        $tournamentsQuery = Tournament::query()->when(
            $clubId !== null,
            fn ($query) => $query->where('club_id', $clubId),
        );

        $matchesQuery = GameMatch::query()
            ->when(
                $clubId !== null,
                fn ($query) => $query->whereHas(
                    'court',
                    fn ($query) => $query->where('club_id', $clubId),
                ),
            );

        return [
            'players' => (clone $playersQuery)->count(),
            'active_players' => (clone $playersQuery)->where('is_active', true)->count(),
            'courts' => (clone $courtsQuery)->count(),
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
            'revenue_this_month' => (float) (clone $bookingsQuery)
                ->where('payment_status', PaymentStatus::Paid)
                ->whereMonth('starts_at', now()->month)
                ->whereYear('starts_at', now()->year)
                ->sum('amount'),
        ];
    }

    public function getRecentMatches(?int $clubId = null, int $limit = 10): Collection
    {
        return GameMatch::query()
            ->with(['tournament', 'court', 'player1.user', 'player2.user', 'winner'])
            ->when(
                $clubId !== null,
                fn ($query) => $query->whereHas(
                    'court',
                    fn ($query) => $query->where('club_id', $clubId),
                ),
            )
            ->whereIn('status', [MatchStatus::Completed, MatchStatus::InProgress])
            ->latest('completed_at')
            ->latest('scheduled_at')
            ->limit($limit)
            ->get();
    }

    public function getRankings(?int $clubId = null, int $limit = 10): Collection
    {
        return Ranking::query()
            ->with(['player.user', 'club'])
            ->when(
                $clubId !== null,
                fn ($query) => $query->where('club_id', $clubId),
            )
            ->orderByDesc('elo_rating')
            ->limit($limit)
            ->get();
    }

    public function getUpcomingTournaments(?int $clubId = null, int $limit = 10): Collection
    {
        return Tournament::query()
            ->with(['club', 'creator'])
            ->when(
                $clubId !== null,
                fn ($query) => $query->where('club_id', $clubId),
            )
            ->where('starts_at', '>', now())
            ->whereNotIn('status', [TournamentStatus::Completed, TournamentStatus::Cancelled])
            ->orderBy('starts_at')
            ->limit($limit)
            ->get();
    }

    public function getCourtAvailability(?int $clubId = null): Collection
    {
        return Court::query()
            ->with([
                'club',
                'bookings' => fn ($query) => $query
                    ->whereDate('starts_at', today())
                    ->whereIn('status', [BookingStatus::Pending, BookingStatus::Approved])
                    ->orderBy('starts_at'),
            ])
            ->when(
                $clubId !== null,
                fn ($query) => $query->where('club_id', $clubId),
            )
            ->orderBy('court_number')
            ->get();
    }

    public function getRevenueChart(?int $clubId = null): array
    {
        $periodExpression = match (DB::connection()->getDriverName()) {
            'sqlite' => "strftime('%Y-%m', starts_at)",
            'pgsql' => "to_char(starts_at, 'YYYY-MM')",
            default => "DATE_FORMAT(starts_at, '%Y-%m')",
        };

        $rows = CourtBooking::query()
            ->select([
                DB::raw("{$periodExpression} as period"),
                DB::raw('SUM(amount) as total'),
            ])
            ->where('payment_status', PaymentStatus::Paid)
            ->when(
                $clubId !== null,
                fn ($query) => $query->whereHas(
                    'court',
                    fn ($query) => $query->where('club_id', $clubId),
                ),
            )
            ->where('starts_at', '>=', now()->subMonths(11)->startOfMonth())
            ->groupBy('period')
            ->orderBy('period')
            ->get();

        return $rows->map(function ($row) {
            [$year, $month] = explode('-', (string) $row->period);

            return [
                'year' => (int) $year,
                'month' => (int) $month,
                'total' => (float) $row->total,
            ];
        })->all();
    }

    public function getMatchStats(?int $clubId = null): array
    {
        $query = GameMatch::query()
            ->when(
                $clubId !== null,
                fn ($query) => $query->whereHas(
                    'court',
                    fn ($query) => $query->where('club_id', $clubId),
                ),
            );

        return [
            'scheduled' => (clone $query)->where('status', MatchStatus::Scheduled)->count(),
            'in_progress' => (clone $query)->where('status', MatchStatus::InProgress)->count(),
            'completed' => (clone $query)->where('status', MatchStatus::Completed)->count(),
            'cancelled' => (clone $query)->where('status', MatchStatus::Cancelled)->count(),
            'total' => (clone $query)->count(),
        ];
    }

    public function getRecentBookings(?int $clubId = null, int $limit = 8): Collection
    {
        return CourtBooking::query()
            ->with(['court', 'user'])
            ->when(
                $clubId !== null,
                fn ($query) => $query->whereHas(
                    'court',
                    fn ($query) => $query->where('club_id', $clubId),
                ),
            )
            ->latest('starts_at')
            ->limit($limit)
            ->get();
    }

    public function getUpcomingOpenPlay(?int $clubId = null, int $limit = 6): Collection
    {
        return ClubEvent::query()
            ->when(
                $clubId !== null,
                fn ($query) => $query->where('club_id', $clubId),
            )
            ->where('starts_at', '>=', now())
            ->orderBy('starts_at')
            ->limit($limit)
            ->get();
    }
}
