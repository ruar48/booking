<?php

namespace App\Services;

use App\Enums\BracketGenerationMode;
use App\Enums\MatchStatus;
use App\Enums\TeamSize;
use App\Enums\TournamentFormat;
use App\Models\ClubEvent;
use App\Models\ClubEventMatch;
use App\Models\ClubEventRegistration;

class OpenPlayBracketService
{
    public function __construct(
        private readonly OpenPlayRegistrationService $registrationService,
    ) {}

    /**
     * @return string|null An error message, or null on success.
     */
    public function generate(ClubEvent $event): ?string
    {
        if ($event->matches()->exists()) {
            return 'Bracket already generated. Reset it first.';
        }

        if ($event->bracket_generation === BracketGenerationMode::Manual) {
            return 'This session uses manual matchups — add matchups directly instead of generating.';
        }

        $format = $event->bracket_format;

        if ($format === null) {
            return 'Choose a bracket format for this session first.';
        }

        $isDoubles = $event->team_size === TeamSize::Doubles;

        if ($isDoubles) {
            // Randomly pair up anyone still waiting for a doubles partner
            // so they aren't left out of the bracket.
            $this->registrationService->pairRandomly($event);
        }

        $registrationsQuery = $event->registrations()->orderBy('id');

        if ($isDoubles) {
            // A leftover unpaired player (odd number of solo sign-ups) can't
            // form a 2v2 team and is excluded from this bracket.
            $registrationsQuery->whereNotNull('partner_player_id');
        }

        $registrationIds = $registrationsQuery->pluck('id')->values();

        if ($registrationIds->count() < 2) {
            return 'Register at least 2 players/teams first.';
        }

        if ($event->bracket_generation === BracketGenerationMode::Random) {
            $registrationIds = $registrationIds->shuffle()->values();
        }

        if ($format === TournamentFormat::SingleElimination) {
            $this->generateSingleElimination($event, $registrationIds);
        } else {
            $this->generateRoundRobin($event, $registrationIds);
        }

        return null;
    }

    /**
     * @return string|null An error message, or null on success.
     */
    public function addManualMatch(ClubEvent $event, ClubEventRegistration $entry1, ClubEventRegistration $entry2): ?string
    {
        if ($entry1->id === $entry2->id) {
            return 'Choose two different entries.';
        }

        ClubEventMatch::query()->create([
            'club_event_id' => $event->id,
            'entry1_id' => $entry1->id,
            'entry2_id' => $entry2->id,
            'round' => 1,
            'bracket_position' => null,
            'status' => MatchStatus::Scheduled,
        ]);

        return null;
    }

    private function generateRoundRobin(ClubEvent $event, $registrationIds): void
    {
        $now = now();
        $matches = [];

        for ($i = 0; $i < $registrationIds->count(); $i++) {
            for ($j = $i + 1; $j < $registrationIds->count(); $j++) {
                $matches[] = [
                    'club_event_id' => $event->id,
                    'entry1_id' => $registrationIds[$i],
                    'entry2_id' => $registrationIds[$j],
                    'round' => 1,
                    'bracket_position' => null,
                    'status' => MatchStatus::Scheduled->value,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        ClubEventMatch::query()->insert($matches);
    }

    private function generateSingleElimination(ClubEvent $event, $registrationIds): void
    {
        $seeds = $registrationIds->values();
        $entryCount = $seeds->count();
        $bracketSize = 2 ** (int) ceil(log($entryCount, 2));
        $byeCount = $bracketSize - $entryCount;
        $round1MatchCount = intdiv($bracketSize, 2);

        $remainingSeeds = $seeds->slice($byeCount)->values();
        $byeMatches = [];

        for ($position = 0; $position < $round1MatchCount; $position++) {
            if ($position < $byeCount) {
                $match = ClubEventMatch::query()->create([
                    'club_event_id' => $event->id,
                    'entry1_id' => $seeds[$position],
                    'entry2_id' => null,
                    'round' => 1,
                    'bracket_position' => $position,
                    'status' => MatchStatus::Completed,
                    'winner_registration_id' => $seeds[$position],
                ]);
                $byeMatches[] = $match;

                continue;
            }

            $offset = ($position - $byeCount) * 2;

            ClubEventMatch::query()->create([
                'club_event_id' => $event->id,
                'entry1_id' => $remainingSeeds[$offset],
                'entry2_id' => $remainingSeeds[$offset + 1],
                'round' => 1,
                'bracket_position' => $position,
                'status' => MatchStatus::Scheduled,
            ]);
        }

        $totalRounds = (int) log($bracketSize, 2);

        for ($round = 2; $round <= $totalRounds; $round++) {
            $matchCount = intdiv($bracketSize, 2 ** $round);

            for ($position = 0; $position < $matchCount; $position++) {
                ClubEventMatch::query()->create([
                    'club_event_id' => $event->id,
                    'entry1_id' => null,
                    'entry2_id' => null,
                    'round' => $round,
                    'bracket_position' => $position,
                    'status' => MatchStatus::Scheduled,
                ]);
            }
        }

        foreach ($byeMatches as $match) {
            $this->advanceWinner($match);
        }
    }

    public function advanceWinner(ClubEventMatch $match): void
    {
        $event = $match->clubEvent;

        if ($event->bracket_format !== TournamentFormat::SingleElimination) {
            return;
        }

        if ($match->winner_registration_id === null || $match->bracket_position === null) {
            return;
        }

        $nextMatch = ClubEventMatch::query()
            ->where('club_event_id', $match->club_event_id)
            ->where('round', $match->round + 1)
            ->where('bracket_position', intdiv($match->bracket_position, 2))
            ->first();

        if ($nextMatch === null) {
            return;
        }

        $slot = $match->bracket_position % 2 === 0 ? 'entry1_id' : 'entry2_id';

        $nextMatch->update([$slot => $match->winner_registration_id]);
    }
}
