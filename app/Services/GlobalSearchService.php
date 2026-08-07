<?php

namespace App\Services;

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

    public function search(string $query): array
    {
        $query = trim($query);

        if ($query === '') {
            return $this->emptyResults();
        }

        $like = '%'.$query.'%';

        return [
            'players' => $this->searchPlayers($like),
            'coaches' => $this->searchCoaches($like),
            'courts' => $this->searchResources($like),
            'bookings' => $this->searchBookings($like),
            'matches' => $this->searchMatches($like),
            'tournaments' => $this->searchTournaments($like),
        ];
    }

    private function emptyResults(): array
    {
        return [
            'players' => collect(),
            'coaches' => collect(),
            'courts' => collect(),
            'bookings' => collect(),
            'matches' => collect(),
            'tournaments' => collect(),
        ];
    }

    private function searchPlayers(string $like): Collection
    {
        return Player::query()
            ->with('user')
            ->whereHas('user', fn ($q) => $q
                ->where('name', 'like', $like)
                ->orWhere('email', 'like', $like))
            ->limit(self::LIMIT_PER_TYPE)
            ->get();
    }

    private function searchCoaches(string $like): Collection
    {
        return Coach::query()
            ->with('user')
            ->whereHas('user', fn ($q) => $q
                ->where('name', 'like', $like)
                ->orWhere('email', 'like', $like))
            ->limit(self::LIMIT_PER_TYPE)
            ->get();
    }

    private function searchResources(string $like): Collection
    {
        return Resource::query()
            ->where(fn ($q) => $q
                ->where('name', 'like', $like)
                ->orWhere('resource_number', 'like', $like))
            ->limit(self::LIMIT_PER_TYPE)
            ->get();
    }

    private function searchBookings(string $like): Collection
    {
        return ResourceBooking::query()
            ->with(['resource', 'user'])
            ->where(fn ($q) => $q
                ->where('notes', 'like', $like)
                ->orWhereHas('user', fn ($q) => $q->where('name', 'like', $like))
                ->orWhereHas('resource', fn ($q) => $q->where('name', 'like', $like)))
            ->limit(self::LIMIT_PER_TYPE)
            ->get();
    }

    private function searchMatches(string $like): Collection
    {
        return GameMatch::query()
            ->with(['player1.user', 'player2.user', 'tournament'])
            ->where(fn ($q) => $q
                ->whereHas('player1.user', fn ($q) => $q->where('name', 'like', $like))
                ->orWhereHas('player2.user', fn ($q) => $q->where('name', 'like', $like))
                ->orWhereHas('tournament', fn ($q) => $q->where('name', 'like', $like)))
            ->limit(self::LIMIT_PER_TYPE)
            ->get();
    }

    private function searchTournaments(string $like): Collection
    {
        return Tournament::query()
            ->where(fn ($q) => $q
                ->where('name', 'like', $like)
                ->orWhere('description', 'like', $like))
            ->limit(self::LIMIT_PER_TYPE)
            ->get();
    }
}
