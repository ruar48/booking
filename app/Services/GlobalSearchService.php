<?php

namespace App\Services;

use App\Models\Club;
use App\Models\Coach;
use App\Models\GameMatch;
use App\Models\Player;
use App\Models\Resource;
use App\Models\ResourceBooking;
use App\Models\Tournament;
use Illuminate\Support\Collection;

class GlobalSearchService
{
    private const int LIMIT_PER_TYPE = 5;

    public function search(string $query, ?int $clubId = null): array
    {
        $query = trim($query);

        if ($query === '') {
            return $this->emptyResults();
        }

        $like = '%'.$query.'%';

        return [
            'players' => $this->searchPlayers($like, $clubId),
            'coaches' => $this->searchCoaches($like, $clubId),
            'clubs' => $this->searchClubs($like),
            'courts' => $this->searchResources($like, $clubId),
            'bookings' => $this->searchBookings($like, $clubId),
            'matches' => $this->searchMatches($like, $clubId),
            'tournaments' => $this->searchTournaments($like, $clubId),
        ];
    }

    private function emptyResults(): array
    {
        return [
            'players' => collect(),
            'coaches' => collect(),
            'clubs' => collect(),
            'courts' => collect(),
            'bookings' => collect(),
            'matches' => collect(),
            'tournaments' => collect(),
        ];
    }

    private function searchPlayers(string $like, ?int $clubId): Collection
    {
        return Player::query()
            ->with('user')
            ->when($clubId !== null, fn ($q) => $q->where('club_id', $clubId))
            ->whereHas('user', fn ($q) => $q
                ->where('name', 'like', $like)
                ->orWhere('email', 'like', $like))
            ->limit(self::LIMIT_PER_TYPE)
            ->get();
    }

    private function searchCoaches(string $like, ?int $clubId): Collection
    {
        return Coach::query()
            ->with('user')
            ->when($clubId !== null, fn ($q) => $q->where('club_id', $clubId))
            ->whereHas('user', fn ($q) => $q
                ->where('name', 'like', $like)
                ->orWhere('email', 'like', $like))
            ->limit(self::LIMIT_PER_TYPE)
            ->get();
    }

    private function searchClubs(string $like): Collection
    {
        return Club::query()
            ->where('name', 'like', $like)
            ->orWhere('city', 'like', $like)
            ->limit(self::LIMIT_PER_TYPE)
            ->get();
    }

    private function searchResources(string $like, ?int $clubId): Collection
    {
        return Resource::query()
            ->when($clubId !== null, fn ($q) => $q->where('club_id', $clubId))
            ->where(fn ($q) => $q
                ->where('name', 'like', $like)
                ->orWhere('resource_number', 'like', $like))
            ->limit(self::LIMIT_PER_TYPE)
            ->get();
    }

    private function searchBookings(string $like, ?int $clubId): Collection
    {
        return ResourceBooking::query()
            ->with(['resource', 'user'])
            ->when($clubId !== null, fn ($q) => $q->whereHas(
                'resource',
                fn ($q) => $q->where('club_id', $clubId),
            ))
            ->where(fn ($q) => $q
                ->where('notes', 'like', $like)
                ->orWhereHas('user', fn ($q) => $q->where('name', 'like', $like))
                ->orWhereHas('resource', fn ($q) => $q->where('name', 'like', $like)))
            ->limit(self::LIMIT_PER_TYPE)
            ->get();
    }

    private function searchMatches(string $like, ?int $clubId): Collection
    {
        return GameMatch::query()
            ->with(['player1.user', 'player2.user', 'tournament'])
            ->when($clubId !== null, fn ($q) => $q->whereHas(
                'tournament',
                fn ($q) => $q->where('club_id', $clubId),
            ))
            ->where(fn ($q) => $q
                ->whereHas('player1.user', fn ($q) => $q->where('name', 'like', $like))
                ->orWhereHas('player2.user', fn ($q) => $q->where('name', 'like', $like))
                ->orWhereHas('tournament', fn ($q) => $q->where('name', 'like', $like)))
            ->limit(self::LIMIT_PER_TYPE)
            ->get();
    }

    private function searchTournaments(string $like, ?int $clubId): Collection
    {
        return Tournament::query()
            ->when($clubId !== null, fn ($q) => $q->where('club_id', $clubId))
            ->where(fn ($q) => $q
                ->where('name', 'like', $like)
                ->orWhere('description', 'like', $like))
            ->limit(self::LIMIT_PER_TYPE)
            ->get();
    }
}
