<?php

namespace Database\Seeders;

use App\Enums\MatchStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\Role as RoleEnum;
use App\Models\OpenPlayMatch;
use App\Models\OpenPlayRegistration;
use App\Models\OpenPlaySession;
use App\Models\Payment;
use App\Models\Player;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Seeds open play sessions with registrations already marked as paid (plus
 * their matching Payment ledger rows), so the "joined & paid" state — roster,
 * payments admin page, and bracket — can all be viewed without going through
 * the Paymongo checkout flow.
 */
class OpenPlayPaidJoinSeeder extends Seeder
{
    private const PASSWORD = 'password';

    public function run(): void
    {
        $this->seedSinglesBracketSession();
        $this->seedDoublesRoundRobinSession();
    }

    /**
     * A 4-player single elimination session, fully paid, with the semifinals
     * completed and the final still upcoming — exercises the roster, the
     * payments ledger, and the bracket tree all at once.
     */
    private function seedSinglesBracketSession(): void
    {
        $session = OpenPlaySession::factory()->create([
            'title' => 'Paid Test Open Play',
            'description' => 'Seeded session with paid registrations and a live bracket, for testing the "joined & paid" state.',
            'starts_at' => now()->addDays(3)->setTime(18, 0),
            'ends_at' => now()->addDays(3)->setTime(21, 0),
            'location' => 'Courts 1, 2',
            'price_per_player' => 10,
            'max_players' => 8,
            'skill_level' => 'all_levels',
            'team_size' => 'singles',
            'bracket_format' => 'single_elimination',
        ]);

        $players = collect([
            ['name' => 'Paid Test Player', 'email' => 'paidplayer@galaangramos.test'],
            ['name' => 'Paid Player Two', 'email' => 'paidplayer2@galaangramos.test'],
            ['name' => 'Paid Player Three', 'email' => 'paidplayer3@galaangramos.test'],
            ['name' => 'Paid Player Four', 'email' => 'paidplayer4@galaangramos.test'],
        ])->map(fn (array $spec) => $this->paidPlayer($spec['name'], $spec['email']));

        $registrations = $players->map(
            fn (Player $player) => $this->registerPaid($session, $player, amount: $session->price_per_player),
        );

        $semifinal1 = OpenPlayMatch::query()->create([
            'open_play_session_id' => $session->id,
            'entry1_id' => $registrations[0]->id,
            'entry2_id' => $registrations[1]->id,
            'entry1_score' => 11,
            'entry2_score' => 7,
            'winner_registration_id' => $registrations[0]->id,
            'status' => MatchStatus::Completed,
            'round' => 1,
            'bracket_position' => 0,
        ]);

        $semifinal2 = OpenPlayMatch::query()->create([
            'open_play_session_id' => $session->id,
            'entry1_id' => $registrations[2]->id,
            'entry2_id' => $registrations[3]->id,
            'entry1_score' => 11,
            'entry2_score' => 9,
            'winner_registration_id' => $registrations[2]->id,
            'status' => MatchStatus::Completed,
            'round' => 1,
            'bracket_position' => 1,
        ]);

        OpenPlayMatch::query()->create([
            'open_play_session_id' => $session->id,
            'entry1_id' => $semifinal1->winner_registration_id,
            'entry2_id' => $semifinal2->winner_registration_id,
            'status' => MatchStatus::Scheduled,
            'round' => 2,
            'bracket_position' => 0,
        ]);
    }

    /**
     * Two paid doubles teams in a round robin session with no bracket
     * generated yet — exercises partner pairing on the roster.
     */
    private function seedDoublesRoundRobinSession(): void
    {
        $session = OpenPlaySession::factory()->create([
            'title' => 'Paid Test Doubles Mixer',
            'description' => 'Seeded doubles session with paid teams, for testing partner pairing and payments.',
            'starts_at' => now()->addDays(5)->setTime(17, 0),
            'ends_at' => now()->addDays(5)->setTime(20, 0),
            'location' => 'Courts 1, 2',
            'price_per_player' => 15,
            'max_players' => 8,
            'skill_level' => 'intermediate',
            'team_size' => 'doubles',
            'bracket_format' => 'round_robin',
        ]);

        $teamOne = [
            $this->paidPlayer('Paid Doubles One', 'paiddoubles1@galaangramos.test'),
            $this->paidPlayer('Paid Doubles Two', 'paiddoubles2@galaangramos.test'),
        ];

        $teamTwo = [
            $this->paidPlayer('Paid Doubles Three', 'paiddoubles3@galaangramos.test'),
            $this->paidPlayer('Paid Doubles Four', 'paiddoubles4@galaangramos.test'),
        ];

        $this->registerPaid($session, $teamOne[0], $teamOne[1], amount: $session->price_per_player * 2);
        $this->registerPaid($session, $teamTwo[0], $teamTwo[1], amount: $session->price_per_player * 2);
    }

    private function paidPlayer(string $name, string $email): Player
    {
        $user = User::query()->firstOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => Hash::make(self::PASSWORD),
                'email_verified_at' => now(),
            ],
        );

        if (! $user->email_verified_at) {
            $user->forceFill(['email_verified_at' => now()])->save();
        }

        if (! $user->hasRole(RoleEnum::Player)) {
            $user->assignRole(RoleEnum::Player);
        }

        return Player::query()->firstOrCreate(
            ['user_id' => $user->id],
            ['birthdate' => now()->subYears(25)->toDateString()],
        );
    }

    private function registerPaid(
        OpenPlaySession $session,
        Player $player,
        ?Player $partner = null,
        float $amount = 0,
    ): OpenPlayRegistration {
        $registration = OpenPlayRegistration::query()->create([
            'open_play_session_id' => $session->id,
            'player_id' => $player->id,
            'partner_player_id' => $partner?->id,
            'payment_status' => PaymentStatus::Paid,
            'amount' => $amount,
            'created_by' => $player->user_id,
        ]);

        Payment::query()->create([
            'user_id' => $player->user_id,
            'payable_type' => OpenPlayRegistration::class,
            'payable_id' => $registration->id,
            'invoice_number' => 'INV-'.Str::upper(Str::random(10)),
            'amount' => $amount,
            'currency' => 'PHP',
            'status' => PaymentStatus::Paid,
            'payment_method' => PaymentMethod::Gcash->value,
            'paid_at' => now(),
        ]);

        return $registration;
    }
}
