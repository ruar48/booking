<?php

namespace Database\Seeders;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\Role as RoleEnum;
use App\Models\OpenPlayRegistration;
use App\Models\OpenPlaySession;
use App\Models\Payment;
use App\Models\Player;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Seeds a single open play session with a registration already marked as
 * paid, so the "already joined & paid" state can be viewed without having
 * to go through the Paymongo checkout flow.
 */
class OpenPlayPaidJoinSeeder extends Seeder
{
    public function run(): void
    {
        $session = OpenPlaySession::factory()->create([
            'title' => 'Paid Test Open Play',
            'description' => 'Seeded session with a registration already marked as paid, for testing the "joined & paid" state.',
            'starts_at' => now()->addDays(3)->setTime(18, 0),
            'ends_at' => now()->addDays(3)->setTime(21, 0),
            'location' => 'Courts 1, 2',
            'price_per_player' => 10,
            'max_players' => 16,
            'skill_level' => 'all_levels',
        ]);

        $user = User::query()->firstOrCreate(
            ['email' => 'paidplayer@galaangramos.test'],
            [
                'name' => 'Paid Test Player',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );
        if (! $user->hasRole(RoleEnum::Player)) {
            $user->assignRole(RoleEnum::Player);
        }
        if (! $user->email_verified_at) {
            $user->forceFill(['email_verified_at' => now()])->save();
        }

        $player = Player::query()->firstOrCreate(['user_id' => $user->id]);

        $registration = OpenPlayRegistration::query()->create([
            'open_play_session_id' => $session->id,
            'player_id' => $player->id,
            'payment_status' => PaymentStatus::Paid,
            'amount' => $session->price_per_player,
            'created_by' => $user->id,
        ]);

        Payment::query()->create([
            'user_id' => $user->id,
            'payable_type' => OpenPlayRegistration::class,
            'payable_id' => $registration->id,
            'invoice_number' => 'INV-'.Str::upper(Str::random(10)),
            'amount' => $registration->amount,
            'currency' => 'PHP',
            'status' => PaymentStatus::Paid,
            'payment_method' => PaymentMethod::Gcash->value,
            'paid_at' => now(),
        ]);
    }
}
