<?php

namespace Database\Seeders;

use App\Enums\BracketGenerationMode;
use App\Enums\MatchStatus;
use App\Enums\TeamSize;
use App\Enums\TournamentFormat;
use App\Models\Club;
use App\Models\ClubEvent;
use App\Models\ClubEventRegistration;
use App\Models\Player;
use App\Services\OpenPlayBracketService;
use Illuminate\Database\Seeder;

class OpenPlayDoubleEliminationSeeder extends Seeder
{
    public function run(): void
    {
        $club = Club::where('slug', 'galaang-ramos-pickleball')->first() ?? Club::first();

        if (! $club) {
            $this->command?->warn('No club found — skipping double elimination demo seed.');

            return;
        }

        if (ClubEvent::where('club_id', $club->id)->where('title', 'Double Elimination Showdown')->exists()) {
            $this->command?->info('Double elimination demo session already seeded — skipping.');

            return;
        }

        $owner = $club->users()->first();

        $members = Player::where('club_id', $club->id)->take(7)->get();

        if ($members->count() < 7) {
            $missing = 7 - $members->count();

            $members = $members->merge(
                Player::factory()->count($missing)->create(['club_id' => $club->id])
            );
        }

        // 7 entries: bracketSize 8, one bye in round 1 — enough to show a
        // bye, a losers-bracket walkover, real losers-bracket matches, and
        // several matches still awaiting a result, all in one session.
        $session = ClubEvent::factory()->create([
            'club_id' => $club->id,
            'title' => 'Double Elimination Showdown',
            'description' => 'Lose once and you drop to the losers bracket — lose twice and you\'re out. Winners bracket and losers bracket champions meet in the grand final.',
            'starts_at' => now()->subHours(2),
            'ends_at' => now()->addHours(3),
            'location' => 'Courts 1, 2',
            'price_per_player' => 15,
            'max_players' => 8,
            'skill_level' => 'intermediate',
            'team_size' => TeamSize::Singles,
            'bracket_format' => TournamentFormat::DoubleElimination,
            'bracket_generation' => BracketGenerationMode::Automatic,
        ]);

        $entries = $members->map(fn (Player $player) => ClubEventRegistration::query()->create([
            'club_event_id' => $session->id,
            'player_id' => $player->id,
            'created_by' => $owner?->id,
        ]))->values();

        $bracketService = app(OpenPlayBracketService::class);
        $bracketService->generate($session->fresh());

        $winnersRound1 = $session->matches()
            ->where('bracket_side', 'winners')
            ->where('round', 1)
            ->orderBy('bracket_position')
            ->get();

        // Position 0 is the bye (auto-completed by generate()). Play
        // positions 1 and 2 so their losers drop into the losers bracket;
        // leave position 3 unplayed so the bracket still reads "in progress".
        $scores = [1 => [11, 8], 2 => [11, 6]];

        foreach ($scores as $position => [$score1, $score2]) {
            $match = $winnersRound1->firstWhere('bracket_position', $position);

            if (! $match) {
                continue;
            }

            $match->update([
                'entry1_score' => $score1,
                'entry2_score' => $score2,
                'winner_registration_id' => $match->entry1_id,
                'status' => MatchStatus::Completed,
            ]);

            $bracketService->advanceWinner($match->fresh());
        }

        // Play one winners-bracket round-2 match so the winners-bracket
        // final has a seed in it, and so a real (non-bye) loser reaches the
        // losers bracket's second round too.
        $winnersRound2FirstMatch = $session->matches()
            ->where('bracket_side', 'winners')
            ->where('round', 2)
            ->orderBy('bracket_position')
            ->first();

        if ($winnersRound2FirstMatch && $winnersRound2FirstMatch->entry1_id && $winnersRound2FirstMatch->entry2_id) {
            $winnersRound2FirstMatch->update([
                'entry1_score' => 11,
                'entry2_score' => 9,
                'winner_registration_id' => $winnersRound2FirstMatch->entry1_id,
                'status' => MatchStatus::Completed,
            ]);

            $bracketService->advanceWinner($winnersRound2FirstMatch->fresh());
        }

        $this->command?->info('Seeded "Double Elimination Showdown" — an ongoing double elimination bracket.');
    }
}
