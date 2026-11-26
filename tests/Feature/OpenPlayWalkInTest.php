<?php

use App\Enums\PaymentStatus;
use App\Enums\Role as RoleEnum;
use App\Models\OpenPlayRegistration;
use App\Models\OpenPlaySession;
use App\Models\Player;
use App\Models\User;

function walkInStaff(): User
{
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole(RoleEnum::ClubAdmin->value);

    return $user;
}

it('registers a walk-in with no account and marks them paid', function () {
    $staff = walkInStaff();
    $session = OpenPlaySession::factory()->create(['price_per_player' => 20, 'max_players' => 32]);

    $this->actingAs($staff)
        ->post(route('open-play.registrations.walk-in', $session), [
            'name' => 'Juan Dela Cruz',
            'phone' => '0917 123 4567',
            'mark_paid' => true,
        ])
        ->assertRedirect();

    $user = User::query()->where('name', 'Juan Dela Cruz')->sole();
    expect($user->phone)->toBe('09171234567')
        ->and($user->hasRole(RoleEnum::Player->value))->toBeTrue();

    $player = Player::query()->where('user_id', $user->id)->sole();
    $registration = OpenPlayRegistration::query()->where('player_id', $player->id)->sole();

    expect($registration->open_play_session_id)->toBe($session->id)
        ->and($registration->payment_status)->toBe(PaymentStatus::Paid)
        ->and((float) $registration->amount)->toBe(20.0)
        ->and($registration->created_by)->toBe($staff->id);
});

it('leaves the walk-in unpaid when not marked paid', function () {
    $session = OpenPlaySession::factory()->create(['price_per_player' => 20, 'max_players' => 32]);

    $this->actingAs(walkInStaff())
        ->post(route('open-play.registrations.walk-in', $session), [
            'name' => 'Maria Santos',
            'phone' => '09181234567',
            'mark_paid' => false,
        ]);

    expect(OpenPlayRegistration::query()->sole()->payment_status)->toBe(PaymentStatus::Unpaid);
});

it('requires a name and phone', function () {
    $session = OpenPlaySession::factory()->create();

    $this->actingAs(walkInStaff())
        ->post(route('open-play.registrations.walk-in', $session), [])
        ->assertSessionHasErrors(['name', 'phone']);

    expect(OpenPlayRegistration::query()->count())->toBe(0);
});

it('forbids non-staff from adding walk-ins', function () {
    $session = OpenPlaySession::factory()->create();
    $player = User::factory()->create(['email_verified_at' => now()]);
    $player->assignRole(RoleEnum::Player->value);

    $this->actingAs($player)
        ->post(route('open-play.registrations.walk-in', $session), [
            'name' => 'Sneaky',
            'phone' => '09170000000',
        ])
        ->assertRedirect(); // venue.admin middleware turns players away

    expect(User::query()->where('name', 'Sneaky')->exists())->toBeFalse();
});
