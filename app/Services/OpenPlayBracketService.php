<?php

namespace App\Services;

use App\Enums\BracketGenerationMode;
use App\Enums\BracketSide;
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
        } elseif ($format === TournamentFormat::DoubleElimination) {
            $this->generateDoubleElimination($event, $registrationIds);
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

    private function generateDoubleElimination(ClubEvent $event, $registrationIds): void
    {
        $seeds = $registrationIds->values();
        $entryCount = $seeds->count();
        $bracketSize = 2 ** (int) ceil(log($entryCount, 2));
        $byeCount = $bracketSize - $entryCount;
        $round1MatchCount = intdiv($bracketSize, 2);
        $totalWbRounds = (int) log($bracketSize, 2);

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
                    'bracket_side' => BracketSide::Winners,
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
                'bracket_side' => BracketSide::Winners,
                'status' => MatchStatus::Scheduled,
            ]);
        }

        for ($round = 2; $round <= $totalWbRounds; $round++) {
            $matchCount = intdiv($bracketSize, 2 ** $round);

            for ($position = 0; $position < $matchCount; $position++) {
                ClubEventMatch::query()->create([
                    'club_event_id' => $event->id,
                    'entry1_id' => null,
                    'entry2_id' => null,
                    'round' => $round,
                    'bracket_position' => $position,
                    'bracket_side' => BracketSide::Winners,
                    'status' => MatchStatus::Scheduled,
                ]);
            }
        }

        $totalLbRounds = 2 * ($totalWbRounds - 1);

        for ($round = 1; $round <= $totalLbRounds; $round++) {
            $wbRoundFeedingIn = (int) ceil($round / 2);
            $matchCount = intdiv($bracketSize, 2 ** ($wbRoundFeedingIn + 1));

            for ($position = 0; $position < $matchCount; $position++) {
                if ($round === 1) {
                    $wbPosition1 = $position * 2;
                    $wbPosition2 = $position * 2 + 1;

                    if ($wbPosition1 < $byeCount && $wbPosition2 < $byeCount) {
                        // Both feeding round-1 matches were byes, so no loser
                        // will ever be produced for this losers-bracket slot.
                        continue;
                    }
                }

                ClubEventMatch::query()->create([
                    'club_event_id' => $event->id,
                    'entry1_id' => null,
                    'entry2_id' => null,
                    'round' => $round,
                    'bracket_position' => $position,
                    'bracket_side' => BracketSide::Losers,
                    'status' => MatchStatus::Scheduled,
                ]);
            }
        }

        ClubEventMatch::query()->create([
            'club_event_id' => $event->id,
            'entry1_id' => null,
            'entry2_id' => null,
            'round' => 1,
            'bracket_position' => 0,
            'bracket_side' => BracketSide::Final,
            'status' => MatchStatus::Scheduled,
        ]);

        foreach ($byeMatches as $match) {
            $this->advanceWinner($match);
        }
    }

    public function advanceWinner(ClubEventMatch $match): void
    {
        $event = $match->clubEvent;

        if ($event->bracket_format === TournamentFormat::SingleElimination) {
            $this->advanceSingleEliminationWinner($match);
        } elseif ($event->bracket_format === TournamentFormat::DoubleElimination) {
            $this->advanceDoubleEliminationWinner($match);
        }
    }

    private function advanceSingleEliminationWinner(ClubEventMatch $match): void
    {
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

    private function advanceDoubleEliminationWinner(ClubEventMatch $match): void
    {
        if ($match->winner_registration_id === null || $match->bracket_position === null) {
            return;
        }

        match ($match->bracket_side) {
            BracketSide::Winners => $this->advanceWinnersBracketMatch($match),
            BracketSide::Losers => $this->advanceLosersBracketMatch($match),
            BracketSide::Final => $this->advanceFinalMatch($match),
            default => null,
        };
    }

    private function advanceWinnersBracketMatch(ClubEventMatch $match): void
    {
        $winnerId = $match->winner_registration_id;
        $loserId = $winnerId === $match->entry1_id ? $match->entry2_id : $match->entry1_id;

        $nextWbMatch = ClubEventMatch::query()
            ->where('club_event_id', $match->club_event_id)
            ->where('bracket_side', BracketSide::Winners)
            ->where('round', $match->round + 1)
            ->where('bracket_position', intdiv($match->bracket_position, 2))
            ->first();

        $isWbFinal = $nextWbMatch === null;

        if ($isWbFinal) {
            // The winners-bracket final's winner reaches the grand final with
            // zero losses. Its loser (if any — a bye has none) still needs to
            // be routed into the losers bracket below, same as any other
            // round; it only skips straight to the grand final's other slot
            // when there is no losers bracket at all (a 2-entry event).
            $final = ClubEventMatch::query()
                ->where('club_event_id', $match->club_event_id)
                ->where('bracket_side', BracketSide::Final)
                ->where('round', 1)
                ->first();

            $final?->update(['entry1_id' => $winnerId]);
        } else {
            $slot = $match->bracket_position % 2 === 0 ? 'entry1_id' : 'entry2_id';
            $nextWbMatch->update([$slot => $winnerId]);
        }

        if ($loserId === null) {
            // Round-1 bye: there is no loser to send to the losers bracket.
            return;
        }

        if ($match->round === 1) {
            $lbTarget = ClubEventMatch::query()
                ->where('club_event_id', $match->club_event_id)
                ->where('bracket_side', BracketSide::Losers)
                ->where('round', 1)
                ->where('bracket_position', intdiv($match->bracket_position, 2))
                ->first();

            $lbSlot = $match->bracket_position % 2 === 0 ? 'entry1_id' : 'entry2_id';
        } else {
            $lbRound = 2 * $match->round - 2;

            $lbTarget = ClubEventMatch::query()
                ->where('club_event_id', $match->club_event_id)
                ->where('bracket_side', BracketSide::Losers)
                ->where('round', $lbRound)
                ->where('bracket_position', $match->bracket_position)
                ->first();

            $lbSlot = 'entry2_id';
        }

        if ($lbTarget !== null) {
            $lbTarget->update([$lbSlot => $loserId]);

            $this->maybeAutoCompleteLosersBye($lbTarget->fresh());

            return;
        }

        if ($isWbFinal) {
            // No losers bracket exists at all (a 2-entry, single-round
            // event): the winners-bracket final IS round 1, and its loser
            // goes straight into the grand final's other slot.
            $final = ClubEventMatch::query()
                ->where('club_event_id', $match->club_event_id)
                ->where('bracket_side', BracketSide::Final)
                ->where('round', 1)
                ->first();

            $final?->update(['entry2_id' => $loserId]);
        }
    }

    private function advanceLosersBracketMatch(ClubEventMatch $match): void
    {
        $winnerId = $match->winner_registration_id;

        // Odd losers-bracket rounds forward straight into the next
        // (receiving) round at the same position, into the slot reserved for
        // the incoming losers-bracket winner (entry1 — entry2 is reserved
        // for that round's incoming winners-bracket loser). Even rounds pair
        // up two adjacent winners into a single next-round match, halving
        // the position — the mirror image of how match counts are
        // generated — and must pick a slot by parity so the two winners
        // don't collide in the same slot.
        $nextRound = $match->round + 1;

        if ($match->round % 2 === 1) {
            $nextPosition = $match->bracket_position;
            $nextSlot = 'entry1_id';
        } else {
            $nextPosition = intdiv($match->bracket_position, 2);
            $nextSlot = $match->bracket_position % 2 === 0 ? 'entry1_id' : 'entry2_id';
        }

        $nextLbMatch = ClubEventMatch::query()
            ->where('club_event_id', $match->club_event_id)
            ->where('bracket_side', BracketSide::Losers)
            ->where('round', $nextRound)
            ->where('bracket_position', $nextPosition)
            ->first();

        if ($nextLbMatch === null) {
            // This was the losers-bracket final.
            $final = ClubEventMatch::query()
                ->where('club_event_id', $match->club_event_id)
                ->where('bracket_side', BracketSide::Final)
                ->where('round', 1)
                ->first();

            $final?->update(['entry2_id' => $winnerId]);

            return;
        }

        $nextLbMatch->update([$nextSlot => $winnerId]);

        $this->maybeAutoCompleteLosersBye($nextLbMatch->fresh());
    }

    private function advanceFinalMatch(ClubEventMatch $match): void
    {
        if ($match->round !== 1) {
            // Bracket-reset match: the tournament ends regardless of who wins.
            return;
        }

        if ($match->winner_registration_id === $match->entry1_id) {
            // The winners-bracket entrant won game one: tournament over.
            return;
        }

        $resetExists = ClubEventMatch::query()
            ->where('club_event_id', $match->club_event_id)
            ->where('bracket_side', BracketSide::Final)
            ->where('round', 2)
            ->exists();

        if ($resetExists) {
            return;
        }

        ClubEventMatch::query()->create([
            'club_event_id' => $match->club_event_id,
            'entry1_id' => $match->entry1_id,
            'entry2_id' => $match->entry2_id,
            'round' => 2,
            'bracket_position' => 0,
            'bracket_side' => BracketSide::Final,
            'status' => MatchStatus::Scheduled,
        ]);
    }

    private function maybeAutoCompleteLosersBye(ClubEventMatch $lbMatch): void
    {
        if ($lbMatch->status === MatchStatus::Completed) {
            return;
        }

        if ($lbMatch->entry1_id !== null && $lbMatch->entry2_id !== null) {
            return;
        }

        $filledId = $lbMatch->entry1_id ?? $lbMatch->entry2_id;

        if ($filledId === null) {
            return;
        }

        $emptySlot = $lbMatch->entry1_id === null ? 'entry1_id' : 'entry2_id';

        if (! $this->isLosersFeederPermanentlyDead($lbMatch, $emptySlot)) {
            return;
        }

        $lbMatch->update([
            'winner_registration_id' => $filledId,
            'status' => MatchStatus::Completed,
        ]);

        $this->advanceWinner($lbMatch);
    }

    private function isLosersFeederPermanentlyDead(ClubEventMatch $lbMatch, string $emptySlot): bool
    {
        if ($lbMatch->round === 1) {
            $wbPosition = $emptySlot === 'entry1_id'
                ? $lbMatch->bracket_position * 2
                : $lbMatch->bracket_position * 2 + 1;

            $wbMatch = ClubEventMatch::query()
                ->where('club_event_id', $lbMatch->club_event_id)
                ->where('bracket_side', BracketSide::Winners)
                ->where('round', 1)
                ->where('bracket_position', $wbPosition)
                ->first();

            return $wbMatch !== null && $wbMatch->entry2_id === null;
        }

        if ($lbMatch->round === 2 && $emptySlot === 'entry1_id') {
            return ! ClubEventMatch::query()
                ->where('club_event_id', $lbMatch->club_event_id)
                ->where('bracket_side', BracketSide::Losers)
                ->where('round', 1)
                ->where('bracket_position', $lbMatch->bracket_position)
                ->exists();
        }

        return false;
    }
}
