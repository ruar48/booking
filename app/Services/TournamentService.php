<?php

namespace App\Services;

use App\Contracts\Repositories\GameMatchRepositoryInterface;
use App\Contracts\Repositories\TournamentRepositoryInterface;
use App\Enums\MatchStatus;
use App\Enums\TournamentStatus;
use App\Models\GameMatch;
use App\Models\Tournament;
use App\Models\TournamentRegistration;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use RuntimeException;

class TournamentService
{
    public function __construct(
        private readonly TournamentRepositoryInterface $tournamentRepository,
        private readonly GameMatchRepositoryInterface $gameMatchRepository,
    ) {}

    public function paginate(int $perPage = 15): LengthAwarePaginator
    {
        return $this->tournamentRepository->paginate($perPage);
    }

    public function find(int $id): ?Tournament
    {
        return $this->tournamentRepository->find($id);
    }

    public function create(array $data): Tournament
    {
        return $this->tournamentRepository->create($data);
    }

    public function update(Tournament $tournament, array $data): Tournament
    {
        return $this->tournamentRepository->update($tournament, $data);
    }

    public function delete(Tournament $tournament): bool
    {
        return $this->tournamentRepository->delete($tournament);
    }

    public function registerPlayer(
        Tournament $tournament,
        int $playerId,
        ?int $categoryId = null,
    ): TournamentRegistration {
        if ($tournament->status !== TournamentStatus::RegistrationOpen) {
            throw new InvalidArgumentException('Tournament registration is not open.');
        }

        $registrationCount = $tournament->registrations()->count();

        if ($registrationCount >= $tournament->max_players) {
            throw new RuntimeException('Tournament has reached maximum player capacity.');
        }

        if ($tournament->registrations()->where('player_id', $playerId)->exists()) {
            throw new RuntimeException('Player is already registered for this tournament.');
        }

        return TournamentRegistration::query()->create([
            'tournament_id' => $tournament->id,
            'tournament_category_id' => $categoryId,
            'player_id' => $playerId,
        ]);
    }

    /**
     * @return Collection<int, GameMatch>
     */
    public function generateBracket(Tournament $tournament): Collection
    {
        $playerIds = $tournament->registrations()
            ->orderBy('seed')
            ->orderBy('id')
            ->pluck('player_id')
            ->values()
            ->all();

        if (count($playerIds) < 2) {
            throw new RuntimeException('At least two players are required to generate a bracket.');
        }

        return DB::transaction(function () use ($tournament, $playerIds): Collection {
            $tournament->matches()->delete();

            $bracketSize = (int) pow(2, (int) ceil(log(count($playerIds), 2)));
            $totalRounds = (int) log($bracketSize, 2);
            $paddedPlayers = array_pad($playerIds, $bracketSize, null);

            $matches = collect();
            $roundMatches = [];

            for ($round = 1; $round <= $totalRounds; $round++) {
                $matchesInRound = (int) ($bracketSize / pow(2, $round));
                $roundMatches[$round] = [];

                for ($matchNumber = 1; $matchNumber <= $matchesInRound; $matchNumber++) {
                    $player1Id = null;
                    $player2Id = null;

                    if ($round === 1) {
                        $index = ($matchNumber - 1) * 2;
                        $player1Id = $paddedPlayers[$index] ?? null;
                        $player2Id = $paddedPlayers[$index + 1] ?? null;
                    }

                    $match = $this->gameMatchRepository->create([
                        'tournament_id' => $tournament->id,
                        'player1_id' => $player1Id,
                        'player2_id' => $player2Id,
                        'round' => $round,
                        'match_number' => $matchNumber,
                        'bracket_position' => $matchNumber,
                        'status' => MatchStatus::Scheduled,
                    ]);

                    $roundMatches[$round][$matchNumber] = $match;
                    $matches->push($match);
                }
            }

            $this->tournamentRepository->update($tournament, [
                'status' => TournamentStatus::InProgress,
            ]);

            return $matches;
        });
    }
}
