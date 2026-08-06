<?php

use App\Enums\BracketGenerationMode;
use App\Enums\TeamSize;
use App\Enums\TournamentFormat;
use App\Models\ClubEvent;
use App\Models\ClubEventMatch;
use App\Models\ClubEventRegistration;
use App\Models\Player;
use App\Services\OpenPlayBracketService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function registerEntries(ClubEvent $event, int $count): void
{
    for ($i = 0; $i < $count; $i++) {
        ClubEventRegistration::query()->create([
            'club_event_id' => $event->id,
            'player_id' => Player::factory()->create()->id,
            'partner_player_id' => null,
        ]);
    }
}

function playMatch(ClubEventMatch $match, OpenPlayBracketService $service, string $winnerSlot = 'entry1_id'): void
{
    $match->refresh();

    $winnerId = $match->{$winnerSlot};

    $match->update([
        'entry1_score' => $winnerSlot === 'entry1_id' ? 11 : 5,
        'entry2_score' => $winnerSlot === 'entry1_id' ? 5 : 11,
        'winner_registration_id' => $winnerId,
        'status' => \App\Enums\MatchStatus::Completed,
    ]);

    $service->advanceWinner($match);
}

it('generates a full double elimination bracket skeleton for 5 entries', function () {
    $event = ClubEvent::factory()->create([
        'bracket_format' => TournamentFormat::DoubleElimination,
        'bracket_generation' => BracketGenerationMode::Automatic,
        'team_size' => TeamSize::Singles,
        'target_score' => 11,
    ]);

    registerEntries($event, 5);

    $service = app(OpenPlayBracketService::class);
    $error = $service->generate($event->fresh());

    expect($error)->toBeNull();

    $event->refresh();

    // bracketSize = 8, k = 3, byeCount = 3
    $winners = $event->matches()->where('bracket_side', 'winners')->get();
    $losers = $event->matches()->where('bracket_side', 'losers')->get();
    $final = $event->matches()->where('bracket_side', 'final')->get();

    expect($winners->where('round', 1))->toHaveCount(4)
        ->and($winners->where('round', 2))->toHaveCount(2)
        ->and($winners->where('round', 3))->toHaveCount(1)
        ->and($final)->toHaveCount(1)
        ->and($final->first()->round)->toBe(1);

    // Losers rounds: totalLbRounds = 2*(3-1) = 4.
    // LB1 matchCount = bracketSize/4 = 2, but position 0 pairs WB1 pos 0,1 (both byes) -> skipped.
    expect($losers->where('round', 1))->toHaveCount(1)
        ->and($losers->where('round', 2))->toHaveCount(2)
        ->and($losers->where('round', 3))->toHaveCount(1)
        ->and($losers->where('round', 4))->toHaveCount(1);
});

it('plays out a full 5-entry double elimination tournament to a champion', function () {
    $event = ClubEvent::factory()->create([
        'bracket_format' => TournamentFormat::DoubleElimination,
        'bracket_generation' => BracketGenerationMode::Automatic,
        'team_size' => TeamSize::Singles,
        'target_score' => 11,
    ]);

    registerEntries($event, 5);

    $service = app(OpenPlayBracketService::class);
    $service->generate($event->fresh());

    $playToDryRun = function () use ($event, $service) {
        $progressed = true;

        while ($progressed) {
            $progressed = false;

            $playable = $event->matches()
                ->where('status', '!=', \App\Enums\MatchStatus::Completed)
                ->whereNotNull('entry1_id')
                ->whereNotNull('entry2_id')
                ->get();

            foreach ($playable as $match) {
                playMatch($match, $service, 'entry1_id');
                $progressed = true;
            }
        }
    };

    $playToDryRun();

    $event->refresh();

    $finalMatches = $event->matches()->where('bracket_side', 'final')->orderBy('round')->get();

    expect($finalMatches)->toHaveCount(1);

    $lastFinal = $finalMatches->last();

    expect($lastFinal->status)->toBe(\App\Enums\MatchStatus::Completed)
        ->and($lastFinal->winner_registration_id)->not->toBeNull()
        ->and($lastFinal->winner_registration_id)->toBe($lastFinal->entry1_id);

    // No losers-bracket or winners-bracket match should be left unplayed
    // with both slots filled.
    $stuck = $event->matches()
        ->where('status', '!=', \App\Enums\MatchStatus::Completed)
        ->whereNotNull('entry1_id')
        ->whereNotNull('entry2_id')
        ->count();

    expect($stuck)->toBe(0);
});

it('creates a bracket reset match when the losers-bracket entrant wins the first grand final', function () {
    $event = ClubEvent::factory()->create([
        'bracket_format' => TournamentFormat::DoubleElimination,
        'bracket_generation' => BracketGenerationMode::Automatic,
        'team_size' => TeamSize::Singles,
        'target_score' => 11,
    ]);

    registerEntries($event, 4);

    $service = app(OpenPlayBracketService::class);
    $service->generate($event->fresh());

    // Play everything with entry1 winning, EXCEPT the first grand final where
    // we force the losers-bracket side (entry2) to win.
    $progressed = true;

    while ($progressed) {
        $progressed = false;

        $playable = $event->matches()
            ->where('status', '!=', \App\Enums\MatchStatus::Completed)
            ->whereNotNull('entry1_id')
            ->whereNotNull('entry2_id')
            ->get();

        foreach ($playable as $match) {
            $slot = ($match->bracket_side === \App\Enums\BracketSide::Final && $match->round === 1)
                ? 'entry2_id'
                : 'entry1_id';
            playMatch($match, $service, $slot);
            $progressed = true;
        }
    }

    $event->refresh();

    $finalMatches = $event->matches()->where('bracket_side', 'final')->orderBy('round')->get();

    expect($finalMatches)->toHaveCount(2);
    expect($finalMatches->last()->round)->toBe(2);
});
