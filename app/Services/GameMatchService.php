<?php

namespace App\Services;

use App\Contracts\Repositories\GameMatchRepositoryInterface;
use App\Enums\MatchStatus;
use App\Models\GameMatch;
use App\Models\MatchSet;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class GameMatchService
{
    public function __construct(
        private readonly GameMatchRepositoryInterface $gameMatchRepository,
        private readonly EloRankingService $eloRankingService,
    ) {}

    public function paginate(int $perPage = 15): LengthAwarePaginator
    {
        return $this->gameMatchRepository->paginate($perPage);
    }

    public function find(int $id): ?GameMatch
    {
        return $this->gameMatchRepository->find($id);
    }

    public function schedule(
        GameMatch $match,
        Carbon $scheduledAt,
        ?int $courtId = null,
        ?int $refereeId = null,
    ): GameMatch {
        return $this->gameMatchRepository->update($match, array_filter([
            'scheduled_at' => $scheduledAt,
            'court_id' => $courtId,
            'referee_id' => $refereeId,
            'status' => MatchStatus::Scheduled,
        ], fn ($value) => $value !== null));
    }

    /**
     * @param  list<array{set_number: int, player1_score: int, player2_score: int}>  $sets
     */
    public function updateScores(GameMatch $match, array $sets): GameMatch
    {
        return DB::transaction(function () use ($match, $sets): GameMatch {
            $match->sets()->delete();

            foreach ($sets as $set) {
                MatchSet::query()->create([
                    'match_id' => $match->id,
                    'set_number' => $set['set_number'],
                    'player1_score' => $set['player1_score'],
                    'player2_score' => $set['player2_score'],
                ]);
            }

            if ($match->status === MatchStatus::Scheduled) {
                $this->gameMatchRepository->update($match, [
                    'status' => MatchStatus::InProgress,
                    'started_at' => $match->started_at ?? now(),
                ]);
            }

            return $match->fresh(['sets']);
        });
    }

    public function complete(GameMatch $match, int $winnerId): GameMatch
    {
        if (! in_array($winnerId, [$match->player1_id, $match->player2_id], true)) {
            throw new InvalidArgumentException('Winner must be one of the match players.');
        }

        return DB::transaction(function () use ($match, $winnerId): GameMatch {
            $match = $this->gameMatchRepository->update($match, [
                'winner_id' => $winnerId,
                'status' => MatchStatus::Completed,
                'completed_at' => now(),
            ]);

            $this->eloRankingService->updateRatings($match);

            $this->advanceTournamentWinner($match);

            return $match->fresh(['sets', 'winner']);
        });
    }

    public function getRecent(int $limit = 10, ?int $clubId = null): Collection
    {
        return $this->gameMatchRepository->getRecent($limit, $clubId);
    }

    private function advanceTournamentWinner(GameMatch $match): void
    {
        if ($match->tournament_id === null || $match->winner_id === null) {
            return;
        }

        $nextRound = $match->round + 1;
        $nextMatchNumber = (int) ceil($match->match_number / 2);

        $nextMatch = GameMatch::query()
            ->where('tournament_id', $match->tournament_id)
            ->where('round', $nextRound)
            ->where('match_number', $nextMatchNumber)
            ->first();

        if ($nextMatch === null) {
            return;
        }

        $slot = $match->match_number % 2 === 1 ? 'player1_id' : 'player2_id';
        $nextMatch->update([$slot => $match->winner_id]);
    }
}
