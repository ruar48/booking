<?php

namespace Database\Seeders;

use App\Enums\BookingStatus;
use App\Enums\BracketGenerationMode;
use App\Enums\MatchStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\Role as RoleEnum;
use App\Enums\Sport;
use App\Enums\TeamSize;
use App\Enums\TournamentFormat;
use App\Models\Announcement;
use App\Models\AuditLog;
use App\Models\OpenPlayMatch;
use App\Models\OpenPlayRegistration;
use App\Models\OpenPlaySession;
use App\Models\Payment;
use App\Models\Player;
use App\Models\Product;
use App\Models\RecurringScheduleLock;
use App\Models\Resource;
use App\Models\ResourceBooking;
use App\Models\Sale;
use App\Models\ScheduleBlock;
use App\Models\Setting;
use App\Models\User;
use App\Services\OpenPlayBracketService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

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

        Setting::query()->create([
            'group' => 'schedule',
            'key' => 'operating_hours',
            'value' => [
                'monday' => ['open' => '07:00', 'close' => '23:00'],
                'tuesday' => ['open' => '07:00', 'close' => '23:00'],
                'wednesday' => ['open' => '07:00', 'close' => '23:00'],
                'thursday' => ['open' => '07:00', 'close' => '23:00'],
                'friday' => ['open' => '07:00', 'close' => '23:00'],
                'saturday' => ['open' => '07:00', 'close' => '23:00'],
                'sunday' => ['open' => '07:00', 'close' => '23:00'],
            ],
        ]);

        $courts = Resource::factory()
            ->count(2)
            ->sequence(
                ['name' => 'Court 1', 'resource_number' => '1', 'surface_type' => 'acrylic', 'has_lighting' => true, 'hourly_rate' => 25],
                ['name' => 'Court 2', 'resource_number' => '2', 'surface_type' => 'acrylic', 'has_lighting' => true, 'hourly_rate' => 25],
            )
            ->create(['sport' => Sport::Pickleball]);

        $billiardsTables = Resource::factory()
            ->count(2)
            ->sequence(
                ['name' => 'Table 1', 'resource_number' => '1', 'surface_type' => 'felt', 'has_lighting' => true, 'hourly_rate' => 15],
                ['name' => 'Table 2', 'resource_number' => '2', 'surface_type' => 'felt', 'has_lighting' => true, 'hourly_rate' => 15],
            )
            ->create(['sport' => Sport::Billiards]);

        $members = collect();

        foreach (range(1, 16) as $index) {
            $member = User::factory()->create([
                'name' => fake()->name(),
                'email' => "member{$index}@galaangramos.test",
                'password' => $password,
            ]);
            $member->assignRole(RoleEnum::Player);

            $members->push(Player::factory()->create([
                'user_id' => $member->id,
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
            $openPlaySessions->push(OpenPlaySession::factory()->create([
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

        $doublesEntry = OpenPlayRegistration::query()->create([
            'open_play_session_id' => $fridaySession->id,
            'player_id' => $members[0]->id,
            'partner_player_id' => $members[1]->id,
            'created_by' => $owner->id,
        ]);

        $singleEntryA = OpenPlayRegistration::query()->create([
            'open_play_session_id' => $fridaySession->id,
            'player_id' => $members[2]->id,
            'created_by' => $owner->id,
        ]);

        $singleEntryB = OpenPlayRegistration::query()->create([
            'open_play_session_id' => $fridaySession->id,
            'player_id' => $members[3]->id,
            'created_by' => $owner->id,
        ]);

        OpenPlayMatch::query()->create([
            'open_play_session_id' => $fridaySession->id,
            'entry1_id' => $doublesEntry->id,
            'entry2_id' => $singleEntryA->id,
            'entry1_score' => 11,
            'entry2_score' => 6,
            'winner_registration_id' => $doublesEntry->id,
            'status' => MatchStatus::Completed,
        ]);

        OpenPlayMatch::query()->create([
            'open_play_session_id' => $fridaySession->id,
            'entry1_id' => $doublesEntry->id,
            'entry2_id' => $singleEntryB->id,
            'entry1_score' => 11,
            'entry2_score' => 4,
            'winner_registration_id' => $doublesEntry->id,
            'status' => MatchStatus::Completed,
        ]);

        OpenPlayMatch::query()->create([
            'open_play_session_id' => $fridaySession->id,
            'entry1_id' => $singleEntryA->id,
            'entry2_id' => $singleEntryB->id,
            'status' => MatchStatus::Scheduled,
        ]);

        // Saturday Smash Session: registrations only, bracket not generated
        // yet, showing the "before you generate a bracket" state.
        $saturdaySession = $openPlaySessions->get(1);

        OpenPlayRegistration::query()->create([
            'open_play_session_id' => $saturdaySession->id,
            'player_id' => $members[0]->id,
            'created_by' => $owner->id,
        ]);

        OpenPlayRegistration::query()->create([
            'open_play_session_id' => $saturdaySession->id,
            'player_id' => $members[2]->id,
            'created_by' => $owner->id,
        ]);

        // Second Friday Open Play: single elimination bracket with an odd
        // (3) entry count, demonstrating an auto-advanced bye alongside a
        // completed round 1 match that has already fed into the final.
        $bracketSession = $openPlaySessions->get(2);

        OpenPlayRegistration::query()->create([
            'open_play_session_id' => $bracketSession->id,
            'player_id' => $members[1]->id,
            'created_by' => $owner->id,
        ]);

        OpenPlayRegistration::query()->create([
            'open_play_session_id' => $bracketSession->id,
            'player_id' => $members[2]->id,
            'created_by' => $owner->id,
        ]);

        OpenPlayRegistration::query()->create([
            'open_play_session_id' => $bracketSession->id,
            'player_id' => $members[3]->id,
            'created_by' => $owner->id,
        ]);

        $bracketSession->update([
            'bracket_format' => TournamentFormat::SingleElimination,
            'bracket_generation' => BracketGenerationMode::Random,
        ]);
        $bracketService->generate($bracketSession);

        $round1Match = OpenPlayMatch::query()
            ->where('open_play_session_id', $bracketSession->id)
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
            OpenPlayRegistration::query()->create([
                'open_play_session_id' => $doublesMixer->id,
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
            OpenPlayRegistration::query()->create([
                'open_play_session_id' => $knockoutSession->id,
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
            OpenPlayRegistration::query()->create([
                'open_play_session_id' => $beginnerSession->id,
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
            $manualEntries->push(OpenPlayRegistration::query()->create([
                'open_play_session_id' => $manualSession->id,
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

        // -----------------------------------------------------------------
        // Extra open play sessions: dedicated 1v1 (singles) and 2v2
        // (doubles) formats in a variety of states, for demo purposes.
        // -----------------------------------------------------------------

        // Monday Singles Ladder: 1v1 round robin, fully played standings.
        $singlesLadder = OpenPlaySession::factory()->create([
            'title' => 'Monday Singles Ladder',
            'description' => '1v1 round robin ladder. Every player faces every other player once — climb the standings!',
            'starts_at' => now()->addWeek()->next('Monday')->setTime(18, 0),
            'ends_at' => now()->addWeek()->next('Monday')->setTime(21, 0),
            'location' => 'Court 1',
            'price_per_player' => 10,
            'max_players' => 8,
            'skill_level' => 'intermediate',
            'team_size' => TeamSize::Singles,
            'bracket_format' => TournamentFormat::RoundRobin,
            'bracket_generation' => BracketGenerationMode::Automatic,
        ]);

        foreach ([5, 7, 9, 11] as $index) {
            OpenPlayRegistration::query()->create([
                'open_play_session_id' => $singlesLadder->id,
                'player_id' => $members[$index]->id,
                'created_by' => $owner->id,
            ]);
        }

        $bracketService->generate($singlesLadder);

        $ladderScores = [[11, 6], [9, 11], [11, 8], [7, 11], [11, 9], [11, 5]];

        $singlesLadder->matches()->orderBy('id')->get()->each(function ($match, $index) use ($ladderScores) {
            [$score1, $score2] = $ladderScores[$index % count($ladderScores)];

            $match->update([
                'entry1_score' => $score1,
                'entry2_score' => $score2,
                'winner_registration_id' => $score1 > $score2 ? $match->entry1_id : $match->entry2_id,
                'status' => MatchStatus::Completed,
            ]);
        });

        // Thursday 1v1 Knockout: singles single elimination, played out to
        // a champion — quarterfinal-style semis feeding a decided final.
        $singlesKnockout = OpenPlaySession::factory()->create([
            'title' => 'Thursday 1v1 Knockout',
            'description' => 'Single elimination, 1v1. Win or go home — last player standing takes the pot.',
            'starts_at' => now()->addDays(4)->setTime(19, 0),
            'ends_at' => now()->addDays(4)->setTime(21, 30),
            'location' => 'Court 2',
            'price_per_player' => 15,
            'max_players' => 8,
            'skill_level' => 'advanced',
            'team_size' => TeamSize::Singles,
            'bracket_format' => TournamentFormat::SingleElimination,
            'bracket_generation' => BracketGenerationMode::Automatic,
        ]);

        foreach ([0, 6, 8, 13] as $index) {
            OpenPlayRegistration::query()->create([
                'open_play_session_id' => $singlesKnockout->id,
                'player_id' => $members[$index]->id,
                'created_by' => $owner->id,
            ]);
        }

        $bracketService->generate($singlesKnockout);

        $knockoutRound1 = $singlesKnockout->matches()->where('round', 1)->orderBy('bracket_position')->get();
        $round1KoScores = [[11, 4], [11, 9]];

        foreach ($knockoutRound1 as $index => $match) {
            [$score1, $score2] = $round1KoScores[$index];

            $match->update([
                'entry1_score' => $score1,
                'entry2_score' => $score2,
                'winner_registration_id' => $score1 > $score2 ? $match->entry1_id : $match->entry2_id,
                'status' => MatchStatus::Completed,
            ]);

            $bracketService->advanceWinner($match->fresh());
        }

        $singlesFinal = $singlesKnockout->matches()->where('round', 2)->first();

        if ($singlesFinal) {
            $singlesFinal->update([
                'entry1_score' => 11,
                'entry2_score' => 8,
                'winner_registration_id' => $singlesFinal->entry1_id,
                'status' => MatchStatus::Completed,
            ]);
        }

        // Tuesday Doubles Social: 2v2 round robin among three teams, fully
        // played so the standings table is complete.
        $doublesSocial = OpenPlaySession::factory()->create([
            'title' => 'Tuesday Doubles Social',
            'description' => '2v2 round robin. Bring a partner — pairings stay fixed for the night.',
            'starts_at' => now()->addWeek()->next('Tuesday')->setTime(18, 30),
            'ends_at' => now()->addWeek()->next('Tuesday')->setTime(21, 0),
            'location' => 'Courts 1, 2',
            'price_per_player' => 12,
            'max_players' => 12,
            'skill_level' => 'all_levels',
            'team_size' => TeamSize::Doubles,
            'bracket_format' => TournamentFormat::RoundRobin,
            'bracket_generation' => BracketGenerationMode::Automatic,
        ]);

        foreach ([[12, 13], [14, 15], [0, 5]] as [$a, $b]) {
            OpenPlayRegistration::query()->create([
                'open_play_session_id' => $doublesSocial->id,
                'player_id' => $members[$a]->id,
                'partner_player_id' => $members[$b]->id,
                'created_by' => $owner->id,
            ]);
        }

        $bracketService->generate($doublesSocial);

        $socialScores = [[11, 9], [8, 11], [11, 6]];

        $doublesSocial->matches()->orderBy('id')->get()->each(function ($match, $index) use ($socialScores) {
            [$score1, $score2] = $socialScores[$index % count($socialScores)];

            $match->update([
                'entry1_score' => $score1,
                'entry2_score' => $score2,
                'winner_registration_id' => $score1 > $score2 ? $match->entry1_id : $match->entry2_id,
                'status' => MatchStatus::Completed,
            ]);
        });

        // Weekend Doubles Knockout: 2v2 single elimination with 4 teams —
        // semis decided, final still pending for the "in progress" state.
        $doublesKnockout = OpenPlaySession::factory()->create([
            'title' => 'Weekend Doubles Knockout',
            'description' => '2v2 single elimination bracket. Four teams enter, one team leaves champion.',
            'starts_at' => now()->addWeek()->next('Saturday')->setTime(13, 0),
            'ends_at' => now()->addWeek()->next('Saturday')->setTime(17, 0),
            'location' => 'Courts 1, 2',
            'price_per_player' => 15,
            'max_players' => 16,
            'skill_level' => 'intermediate',
            'team_size' => TeamSize::Doubles,
            'bracket_format' => TournamentFormat::SingleElimination,
            'bracket_generation' => BracketGenerationMode::Random,
        ]);

        foreach ([[1, 8], [2, 9], [3, 10], [4, 11]] as [$a, $b]) {
            OpenPlayRegistration::query()->create([
                'open_play_session_id' => $doublesKnockout->id,
                'player_id' => $members[$a]->id,
                'partner_player_id' => $members[$b]->id,
                'created_by' => $owner->id,
            ]);
        }

        $bracketService->generate($doublesKnockout);

        $doublesKoRound1 = $doublesKnockout->matches()->where('round', 1)->orderBy('bracket_position')->get();
        $round1DkScores = [[11, 7], [9, 11]];

        foreach ($doublesKoRound1 as $index => $match) {
            [$score1, $score2] = $round1DkScores[$index];

            $match->update([
                'entry1_score' => $score1,
                'entry2_score' => $score2,
                'winner_registration_id' => $score1 > $score2 ? $match->entry1_id : $match->entry2_id,
                'status' => MatchStatus::Completed,
            ]);

            $bracketService->advanceWinner($match->fresh());
        }

        // -----------------------------------------------------------------
        // Extra resource bookings for a busier calendar demo, spread across
        // the current month with a realistic mix of statuses.
        // -----------------------------------------------------------------
        $bookableResources = $courts->merge($billiardsTables);
        $bookingStatusCycle = [
            [BookingStatus::Approved, PaymentStatus::Paid],
            [BookingStatus::Approved, PaymentStatus::Paid],
            [BookingStatus::Approved, PaymentStatus::Unpaid],
            [BookingStatus::Pending, PaymentStatus::Unpaid],
            [BookingStatus::Completed, PaymentStatus::Paid],
            [BookingStatus::Cancelled, PaymentStatus::Refunded],
            [BookingStatus::Rejected, PaymentStatus::Unpaid],
        ];
        $bookingHours = [8, 9, 10, 13, 14, 16, 17, 18, 19, 20];

        foreach (range(-10, 18) as $dayOffset) {
            $bookingsToday = fake()->numberBetween(1, 3);

            foreach (range(1, $bookingsToday) as $slot) {
                $resource = $bookableResources->random();
                $member = $members->random();
                [$status, $paymentStatus] = $bookingStatusCycle[array_rand($bookingStatusCycle)];
                $hour = fake()->randomElement($bookingHours);
                $day = now()->addDays($dayOffset);

                // Past days should read as completed/paid rather than pending.
                if ($dayOffset < 0 && in_array($status, [BookingStatus::Pending], true)) {
                    $status = BookingStatus::Completed;
                    $paymentStatus = PaymentStatus::Paid;
                }

                ResourceBooking::factory()->create([
                    'resource_id' => $resource->id,
                    'user_id' => $member->user_id,
                    'approved_by' => $status === BookingStatus::Pending ? null : $owner->id,
                    'starts_at' => (clone $day)->setTime($hour, 0),
                    'ends_at' => (clone $day)->setTime($hour + 1, 0),
                    'status' => $status,
                    'payment_status' => $paymentStatus,
                    'amount' => $resource->hourly_rate,
                ]);
            }
        }

        // -----------------------------------------------------------------
        // Payments tied to court bookings (separate from the booking's own
        // payment_status column — these back the Payments admin page).
        // -----------------------------------------------------------------
        ResourceBooking::query()
            ->where('payment_status', PaymentStatus::Paid)
            ->latest()
            ->take(8)
            ->get()
            ->each(function (ResourceBooking $booking) {
                Payment::query()->create([
                    'user_id' => $booking->user_id,
                    'payable_type' => ResourceBooking::class,
                    'payable_id' => $booking->id,
                    'invoice_number' => 'INV-'.Str::upper(Str::random(10)),
                    'amount' => $booking->amount ?? 25,
                    'currency' => 'PHP',
                    'status' => PaymentStatus::Paid,
                    'payment_method' => fake()->randomElement(PaymentMethod::cases())->value,
                    'paid_at' => $booking->created_at ?? now(),
                ]);
            });

        ResourceBooking::query()
            ->where('payment_status', PaymentStatus::Unpaid)
            ->where('status', '!=', BookingStatus::Cancelled)
            ->take(4)
            ->get()
            ->each(function (ResourceBooking $booking) {
                Payment::query()->create([
                    'user_id' => $booking->user_id,
                    'payable_type' => ResourceBooking::class,
                    'payable_id' => $booking->id,
                    'invoice_number' => 'INV-'.Str::upper(Str::random(10)),
                    'amount' => $booking->amount ?? 25,
                    'currency' => 'PHP',
                    'status' => PaymentStatus::Pending,
                    'payment_method' => null,
                    'paid_at' => null,
                ]);
            });

        // -----------------------------------------------------------------
        // Schedule blocks & recurring locks (Admin > Schedule page).
        // -----------------------------------------------------------------
        ScheduleBlock::query()->create([
            'resource_id' => $courts[1]->id,
            'starts_at' => now()->addDays(6)->setTime(9, 0),
            'ends_at' => now()->addDays(6)->setTime(13, 0),
            'reason' => 'Court resurfacing maintenance',
            'created_by' => $owner->id,
        ]);

        ScheduleBlock::query()->create([
            'resource_id' => null,
            'starts_at' => now()->addDays(20)->setTime(0, 0),
            'ends_at' => now()->addDays(20)->setTime(23, 59),
            'reason' => 'Club closed — public holiday',
            'created_by' => $owner->id,
        ]);

        RecurringScheduleLock::query()->create([
            'resource_id' => $courts[0]->id,
            'day_of_week' => 1,
            'starts_at' => '12:00',
            'ends_at' => '13:00',
            'reason' => 'Weekly court cleaning',
            'created_by' => $owner->id,
        ]);

        RecurringScheduleLock::query()->create([
            'resource_id' => null,
            'day_of_week' => 0,
            'starts_at' => '06:00',
            'ends_at' => '07:00',
            'reason' => 'Facility inspection',
            'created_by' => $owner->id,
        ]);

        // -----------------------------------------------------------------
        // More announcements for the club feed.
        // -----------------------------------------------------------------
        Announcement::factory()->published()->create([
            'created_by' => $owner->id,
            'title' => 'New 1v1 and 2v2 open play formats',
            'content' => 'We just added dedicated singles ladders and doubles knockouts to Open Play — check the schedule and register your slot.',
            'show_on_dashboard' => true,
            'show_on_home' => true,
            'show_on_player_portal' => true,
        ]);

        Announcement::factory()->published()->create([
            'created_by' => $owner->id,
            'title' => 'Pro shop restock: new paddles in',
            'content' => 'Fresh stock of Pro Series paddles, grip tape, and apparel is now available at the front desk.',
            'show_on_dashboard' => true,
            'show_on_home' => false,
            'show_on_player_portal' => true,
        ]);

        // -----------------------------------------------------------------
        // Audit log entries (Admin > Audit logs page).
        // -----------------------------------------------------------------
        $auditSpecs = [
            ['user' => $owner, 'action' => 'booking.approved', 'type' => ResourceBooking::class, 'days' => 6],
            ['user' => $owner, 'action' => 'booking.rejected', 'type' => ResourceBooking::class, 'days' => 5],
            ['user' => $owner, 'action' => 'sale.completed', 'type' => Sale::class, 'days' => 4],
            ['user' => $owner, 'action' => 'sale.voided', 'type' => Sale::class, 'days' => 3],
            ['user' => $owner, 'action' => 'product.restocked', 'type' => Product::class, 'days' => 3],
            ['user' => $owner, 'action' => 'announcement.published', 'type' => Announcement::class, 'days' => 2],
            ['user' => $owner, 'action' => 'schedule.block_created', 'type' => ScheduleBlock::class, 'days' => 2],
            ['user' => $members->first()->user, 'action' => 'auth.login', 'type' => null, 'days' => 1],
            ['user' => $owner, 'action' => 'payment.marked_paid', 'type' => Payment::class, 'days' => 0],
            ['user' => $owner, 'action' => 'open_play.bracket_generated', 'type' => OpenPlaySession::class, 'days' => 1],
        ];

        foreach ($auditSpecs as $spec) {
            AuditLog::query()->create([
                'user_id' => $spec['user']?->id,
                'action' => $spec['action'],
                'auditable_type' => $spec['type'],
                'auditable_id' => $spec['type'] ? fake()->numberBetween(1, 10) : null,
                'old_values' => null,
                'new_values' => null,
                'ip_address' => fake()->ipv4(),
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'created_at' => now()->subDays($spec['days']),
                'updated_at' => now()->subDays($spec['days']),
            ]);
        }
    }
}
