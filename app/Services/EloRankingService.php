<?php

namespace App\Services;

use App\Models\GameMatch;
use App\Models\Ranking;
use App\Models\RankingHistory;
use Illuminate\Support\Facades\DB;

class EloRankingService
{
    private const int K_FACTOR = 32;

    private const int DEFAULT_RATING = 1200;

    public function updateRatings(GameMatch $match): void
    {
        if ($match->winner_id === null || $match->player1_id === null || $match->player2_id === null) {
            return;
        }

        DB::transaction(function () use ($match): void {
            $player1Ranking = $this->resolveRanking($match->player1_id);
            $player2Ranking = $this->resolveRanking($match->player2_id);

            $player1Won = $match->winner_id === $match->player1_id;

            $player1Change = $this->calculateChange(
                $player1Ranking->elo_rating,
                $player2Ranking->elo_rating,
                $player1Won ? 1.0 : 0.0,
            );

            $player2Change = $this->calculateChange(
                $player2Ranking->elo_rating,
                $player1Ranking->elo_rating,
                $player1Won ? 0.0 : 1.0,
            );

            $this->applyRatingChange($player1Ranking, $player1Change, $match, $player1Won);
            $this->applyRatingChange($player2Ranking, $player2Change, $match, ! $player1Won);
        });
    }

    public function calculateChange(int $playerRating, int $opponentRating, float $actualScore): int
    {
        $expected = 1 / (1 + pow(10, ($opponentRating - $playerRating) / 400));

        return (int) round(self::K_FACTOR * ($actualScore - $expected));
    }

    private function resolveRanking(int $playerId): Ranking
    {
        return Ranking::query()->firstOrCreate(
            ['player_id' => $playerId],
            ['elo_rating' => self::DEFAULT_RATING],
        );
    }

    private function applyRatingChange(
        Ranking $ranking,
        int $change,
        GameMatch $match,
        bool $won,
    ): void {
        $eloBefore = $ranking->elo_rating;
        $eloAfter = max(0, $eloBefore + $change);

        RankingHistory::query()->create([
            'player_id' => $ranking->player_id,
            'match_id' => $match->id,
            'elo_before' => $eloBefore,
            'elo_after' => $eloAfter,
            'elo_change' => $change,
            'recorded_at' => now(),
        ]);

        $ranking->update([
            'elo_rating' => $eloAfter,
            'wins' => $won ? $ranking->wins + 1 : $ranking->wins,
            'losses' => $won ? $ranking->losses : $ranking->losses + 1,
            'matches_played' => $ranking->matches_played + 1,
        ]);
    }
}
