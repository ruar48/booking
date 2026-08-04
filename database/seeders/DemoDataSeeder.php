<?php

namespace Database\Seeders;

use App\Enums\BookingStatus;
use App\Enums\BracketGenerationMode;
use App\Enums\MatchStatus;
use App\Enums\PaymentStatus;
use App\Enums\Role as RoleEnum;
use App\Enums\Sport;
use App\Enums\TeamSize;
use App\Enums\TournamentFormat;
use App\Models\Announcement;
use App\Models\Club;
use App\Models\ClubEvent;
use App\Models\ClubEventMatch;
use App\Models\ClubEventRegistration;
use App\Models\Player;
use App\Models\Resource;
use App\Models\ResourceBooking;
use App\Models\User;
use App\Services\OpenPlayBracketService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $password = Hash::make('password');

        $owner = User::factory()->create([
            'name' => 'Court Owner',
            'email' => 'owner@galaangramos.test',
            'password' => $password,
        ]);
        $owner->assignRole(RoleEnum::SuperAdmin);

        $club = Club::factory()->create([
            'name' => 'Galaang-Ramos Pickleball',
            'slug' => 'galaang-ramos-pickleball',
            'email' => 'owner@galaangramos.test',
            'phone' => '+1 (555) 010-2026',
            'address_line_1' => '123 Court Lane',
            'city' => 'Ramos',
            'state' => 'Pangasinan',
            'postal_code' => '2411',
            'country' => 'PH',
            'description' => 'Welcome to Galaang-Ramos Pickleball — your neighborhood spot for open play and court reservations. We run two indoor acrylic courts with lighting, perfect for beginners and competitive players alike. Book Court 1 or Court 2 online anytime.',
            'operating_hours' => [
                'monday' => ['open' => '07:00', 'close' => '23:00'],
                'tuesday' => ['open' => '07:00', 'close' => '23:00'],
                'wednesday' => ['open' => '07:00', 'close' => '23:00'],
                'thursday' => ['open' => '07:00', 'close' => '23:00'],
                'friday' => ['open' => '07:00', 'close' => '23:00'],
                'saturday' => ['open' => '07:00', 'close' => '23:00'],
                'sunday' => ['open' => '07:00', 'close' => '23:00'],
            ],
            'amenities' => [
                'Parking',
                'Comfort rooms',
                'Changing areas',
                'Water station',
                'Court lighting',
            ],
            'gallery' => [],
        ]);

        $club->users()->attach($owner->id, [
            'membership_status' => 'active',
            'joined_at' => now()->subYear()->toDateString(),
        ]);

        $courts = Resource::factory()
            ->count(2)
            ->sequence(
                ['name' => 'Court 1', 'resource_number' => '1', 'surface_type' => 'acrylic', 'has_lighting' => true, 'hourly_rate' => 25],
                ['name' => 'Court 2', 'resource_number' => '2', 'surface_type' => 'acrylic', 'has_lighting' => true, 'hourly_rate' => 25],
            )
            ->create(['club_id' => $club->id, 'sport' => Sport::Pickleball]);

        $billiardsTables = Resource::factory()
            ->count(2)
            ->sequence(
                ['name' => 'Table 1', 'resource_number' => '1', 'surface_type' => 'felt', 'has_lighting' => true, 'hourly_rate' => 15],
                ['name' => 'Table 2', 'resource_number' => '2', 'surface_type' => 'felt', 'has_lighting' => true, 'hourly_rate' => 15],
            )
            ->create(['club_id' => $club->id, 'sport' => Sport::Billiards]);

        $members = collect();

        foreach (range(1, 16) as $index) {
            $member = User::factory()->create([
                'name' => fake()->name(),
                'email' => "member{$index}@galaangramos.test",
                'password' => $password,
            ]);
            $member->assignRole(RoleEnum::Player);
            $club->users()->attach($member->id, [
                'membership_status' => 'active',
                'joined_at' => now()->subWeeks(fake()->numberBetween(4, 20))->toDateString(),
            ]);

            $members->push(Player::factory()->create([
                'user_id' => $member->id,
                'club_id' => $club->id,
            ]));
        }

        foreach ($members->take(3) as $index => $player) {
            ResourceBooking::factory()->create([
                'resource_id' => $courts[$index % 2]->id,
                'user_id' => $player->user_id,
                'approved_by' => $owner->id,
                'starts_at' => now()->addDays($index + 1)->setTime(9 + $index, 0),
                'ends_at' => now()->addDays($index + 1)->setTime(10 + $index, 0),
                'status' => BookingStatus::Approved,
                'payment_status' => PaymentStatus::Paid,
                'amount' => 25,
            ]);
        }

        ResourceBooking::factory()->create([
            'resource_id' => $courts->first()->id,
            'user_id' => $members->first()->user_id,
            'starts_at' => now()->addDays(2)->setTime(14, 0),
            'ends_at' => now()->addDays(2)->setTime(15, 0),
            'status' => BookingStatus::Approved,
            'payment_status' => PaymentStatus::Unpaid,
            'amount' => 25,
        ]);

        Announcement::factory()->published()->create([
            'club_id' => $club->id,
            'created_by' => $owner->id,
            'title' => 'Welcome to our courts',
            'content' => 'Book Court 1 or Court 2 online anytime. Peak hours are 5–8 PM on weekdays — reserve early!',
            'show_on_dashboard' => true,
            'show_on_home' => true,
            'show_on_player_portal' => true,
        ]);

        $openPlaySpecs = [
            ['title' => 'Friday Open Play', 'starts_at' => now()->next('Friday')->setTime(18, 0)],
            ['title' => 'Saturday Smash Session', 'starts_at' => now()->next('Saturday')->setTime(18, 0)],
            ['title' => 'Friday Open Play', 'starts_at' => now()->addWeek()->next('Friday')->setTime(18, 0)],
            ['title' => 'Sunday Doubles Mixer', 'starts_at' => now()->next('Sunday')->setTime(15, 0)],
            ['title' => 'Midweek Knockout', 'starts_at' => now()->addDays(3)->setTime(19, 0)],
            ['title' => 'Beginner Friendly Open Play', 'starts_at' => now()->addWeek()->next('Sunday')->setTime(10, 0)],
            ['title' => 'Custom Matchup Night', 'starts_at' => now()->addDays(5)->setTime(17, 0)],
        ];

        $openPlaySessions = collect();

        foreach ($openPlaySpecs as $spec) {
            $openPlaySessions->push(ClubEvent::factory()->create([
                'club_id' => $club->id,
                'title' => $spec['title'],
                'description' => 'Drop-in open play for all skill levels. Paddles available on request.',
                'starts_at' => $spec['starts_at'],
                'ends_at' => (clone $spec['starts_at'])->addHours(5),
                'location' => 'Courts 1, 2',
                'price_per_player' => 10,
                'max_players' => 16,
                'skill_level' => 'all_levels',
            ]));
        }

        $bracketService = app(OpenPlayBracketService::class);

        // Friday Open Play: a doubles team plus two singles entries, with a
        // round robin bracket partway played so the manage page shows both
        // completed scores and a still-pending match.
        $fridaySession = $openPlaySessions->get(0);
        $fridaySession->update([
            'team_size' => TeamSize::Doubles,
            'bracket_format' => TournamentFormat::RoundRobin,
            'bracket_generation' => BracketGenerationMode::Automatic,
        ]);

        $doublesEntry = ClubEventRegistration::query()->create([
            'club_event_id' => $fridaySession->id,
            'player_id' => $members[0]->id,
            'partner_player_id' => $members[1]->id,
            'created_by' => $owner->id,
        ]);

        $singleEntryA = ClubEventRegistration::query()->create([
            'club_event_id' => $fridaySession->id,
            'player_id' => $members[2]->id,
            'created_by' => $owner->id,
        ]);

        $singleEntryB = ClubEventRegistration::query()->create([
            'club_event_id' => $fridaySession->id,
            'player_id' => $members[3]->id,
            'created_by' => $owner->id,
        ]);

        ClubEventMatch::query()->create([
            'club_event_id' => $fridaySession->id,
            'entry1_id' => $doublesEntry->id,
            'entry2_id' => $singleEntryA->id,
            'entry1_score' => 11,
            'entry2_score' => 6,
            'winner_registration_id' => $doublesEntry->id,
            'status' => MatchStatus::Completed,
        ]);

        ClubEventMatch::query()->create([
            'club_event_id' => $fridaySession->id,
            'entry1_id' => $doublesEntry->id,
            'entry2_id' => $singleEntryB->id,
            'entry1_score' => 11,
            'entry2_score' => 4,
            'winner_registration_id' => $doublesEntry->id,
            'status' => MatchStatus::Completed,
        ]);

        ClubEventMatch::query()->create([
            'club_event_id' => $fridaySession->id,
            'entry1_id' => $singleEntryA->id,
            'entry2_id' => $singleEntryB->id,
            'status' => MatchStatus::Scheduled,
        ]);

        // Saturday Smash Session: registrations only, bracket not generated
        // yet, showing the "before you generate a bracket" state.
        $saturdaySession = $openPlaySessions->get(1);

        ClubEventRegistration::query()->create([
            'club_event_id' => $saturdaySession->id,
            'player_id' => $members[0]->id,
            'created_by' => $owner->id,
        ]);

        ClubEventRegistration::query()->create([
            'club_event_id' => $saturdaySession->id,
            'player_id' => $members[2]->id,
            'created_by' => $owner->id,
        ]);

        // Second Friday Open Play: single elimination bracket with an odd
        // (3) entry count, demonstrating an auto-advanced bye alongside a
        // completed round 1 match that has already fed into the final.
        $bracketSession = $openPlaySessions->get(2);

        ClubEventRegistration::query()->create([
            'club_event_id' => $bracketSession->id,
            'player_id' => $members[1]->id,
            'created_by' => $owner->id,
        ]);

        ClubEventRegistration::query()->create([
            'club_event_id' => $bracketSession->id,
            'player_id' => $members[2]->id,
            'created_by' => $owner->id,
        ]);

        ClubEventRegistration::query()->create([
            'club_event_id' => $bracketSession->id,
            'player_id' => $members[3]->id,
            'created_by' => $owner->id,
        ]);

        $bracketSession->update([
            'bracket_format' => TournamentFormat::SingleElimination,
            'bracket_generation' => BracketGenerationMode::Random,
        ]);
        $bracketService->generate($bracketSession);

        $round1Match = ClubEventMatch::query()
            ->where('club_event_id', $bracketSession->id)
            ->where('round', 1)
            ->whereNotNull('entry2_id')
            ->first();

        if ($round1Match) {
            $round1Match->update([
                'entry1_score' => 11,
                'entry2_score' => 9,
                'winner_registration_id' => $round1Match->entry1_id,
                'status' => MatchStatus::Completed,
            ]);

            $bracketService->advanceWinner($round1Match);
        }

        // Sunday Doubles Mixer: 4 doubles teams (8 members), a fully played
        // round robin so the manage page shows a complete standings table.
        $doublesMixer = $openPlaySessions->get(3);

        foreach ([[4, 5], [6, 7], [8, 9], [10, 11]] as [$a, $b]) {
            ClubEventRegistration::query()->create([
                'club_event_id' => $doublesMixer->id,
                'player_id' => $members[$a]->id,
                'partner_player_id' => $members[$b]->id,
                'created_by' => $owner->id,
            ]);
        }

        $doublesMixer->update([
            'team_size' => TeamSize::Doubles,
            'bracket_format' => TournamentFormat::RoundRobin,
            'bracket_generation' => BracketGenerationMode::Automatic,
        ]);
        $bracketService->generate($doublesMixer);

        $mixerScores = [[11, 7], [9, 11], [11, 6], [8, 11], [11, 9], [7, 11]];

        $doublesMixer->matches()->orderBy('id')->get()->each(function ($match, $index) use ($mixerScores) {
            [$score1, $score2] = $mixerScores[$index % count($mixerScores)];

            $match->update([
                'entry1_score' => $score1,
                'entry2_score' => $score2,
                'winner_registration_id' => $score1 > $score2 ? $match->entry1_id : $match->entry2_id,
                'status' => MatchStatus::Completed,
            ]);
        });

        // Midweek Knockout: a clean 8-entry single elimination bracket (no
        // byes) with all quarterfinals decided, one semifinal decided, and
        // the other semifinal plus the final still pending — a deeper tree
        // than the other demo sessions.
        $knockoutSession = $openPlaySessions->get(4);

        foreach (range(0, 7) as $index) {
            ClubEventRegistration::query()->create([
                'club_event_id' => $knockoutSession->id,
                'player_id' => $members[$index]->id,
                'created_by' => $owner->id,
            ]);
        }

        $knockoutSession->update([
            'bracket_format' => TournamentFormat::SingleElimination,
            'bracket_generation' => BracketGenerationMode::Automatic,
        ]);
        $bracketService->generate($knockoutSession);

        $quarterfinalScores = [[11, 4], [11, 9], [6, 11], [11, 8]];
        $quarterfinals = $knockoutSession->matches()->where('round', 1)->orderBy('bracket_position')->get();

        foreach ($quarterfinals as $index => $match) {
            [$score1, $score2] = $quarterfinalScores[$index];

            $match->update([
                'entry1_score' => $score1,
                'entry2_score' => $score2,
                'winner_registration_id' => $score1 > $score2 ? $match->entry1_id : $match->entry2_id,
                'status' => MatchStatus::Completed,
            ]);

            $bracketService->advanceWinner($match->fresh());
        }

        $firstSemifinal = $knockoutSession->matches()->where('round', 2)->orderBy('bracket_position')->first();

        if ($firstSemifinal) {
            $firstSemifinal->update([
                'entry1_score' => 11,
                'entry2_score' => 7,
                'winner_registration_id' => $firstSemifinal->entry1_id,
                'status' => MatchStatus::Completed,
            ]);

            $bracketService->advanceWinner($firstSemifinal->fresh());
        }

        // Beginner Friendly Open Play: registrations only, no bracket
        // generated yet — more volume for the "before you generate" state.
        $beginnerSession = $openPlaySessions->get(5);

        foreach ([12, 13, 14] as $index) {
            ClubEventRegistration::query()->create([
                'club_event_id' => $beginnerSession->id,
                'player_id' => $members[$index]->id,
                'created_by' => $owner->id,
            ]);
        }

        // Custom Matchup Night: manual matchups — the admin builds the
        // pairing list by hand instead of generating one, with one match
        // already scored and one still pending.
        $manualSession = $openPlaySessions->get(6);
        $manualSession->update([
            'bracket_format' => TournamentFormat::RoundRobin,
            'bracket_generation' => BracketGenerationMode::Manual,
        ]);

        $manualEntries = collect();

        foreach (range(0, 3) as $index) {
            $manualEntries->push(ClubEventRegistration::query()->create([
                'club_event_id' => $manualSession->id,
                'player_id' => $members[$index]->id,
                'created_by' => $owner->id,
            ]));
        }

        $bracketService->addManualMatch($manualSession, $manualEntries[0], $manualEntries[1]);
        $bracketService->addManualMatch($manualSession, $manualEntries[2], $manualEntries[3]);

        $scoredManualMatch = $manualSession->matches()->orderBy('id')->first();

        if ($scoredManualMatch) {
            $scoredManualMatch->update([
                'entry1_score' => 11,
                'entry2_score' => 8,
                'winner_registration_id' => $scoredManualMatch->entry1_id,
                'status' => MatchStatus::Completed,
            ]);
        }
    }
}
