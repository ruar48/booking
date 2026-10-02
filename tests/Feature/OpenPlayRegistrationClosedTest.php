<?php

use App\Enums\Role as RoleEnum;
use App\Enums\TeamSize;
use App\Models\OpenPlayRegistration;
use App\Models\OpenPlaySession;
use App\Models\Player;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

function closedRegistrationPlayer(): User
{
    Role::findOrCreate(RoleEnum::Player->value, 'web');

    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole(RoleEnum::Player->value);
    Player::factory()->for($user)->create();

    return $user;
}

function openPlaySessionClosingAt(DateTimeInterface $closesAt): OpenPlaySession
{
    return OpenPlaySession::factory()->create([
        'team_size' => TeamSize::Singles,
        'price_per_player' => 0,
        'max_players' => 16,
        'starts_at' => now()->addDays(3),
        'ends_at' => now()->addDays(3)->addHours(2),
        'registration_closes_at' => $closesAt,
    ]);
}

it('rejects joining once registration has closed', function () {
    $user = closedRegistrationPlayer();
    $session = openPlaySessionClosingAt(now()->subMinute());

    $this->actingAs($user)
        ->from(route('open-play.show', $session))
        ->post(route('open-play.join.store', $session))
        ->assertRedirect(route('open-play.show', $session));

    expect(OpenPlayRegistration::query()->where('open_play_session_id', $session->id)->exists())->toBeFalse();
});

it('still allows joining while registration is open', function () {
    $user = closedRegistrationPlayer();
    $session = openPlaySessionClosingAt(now()->addDay());

    $this->actingAs($user)->post(route('open-play.join.store', $session));

    expect(OpenPlayRegistration::query()->where('open_play_session_id', $session->id)->exists())->toBeTrue();
});

it('exposes the closed state to the bracket page', function () {
    $user = closedRegistrationPlayer();
    $session = openPlaySessionClosingAt(now()->subMinute());

    $this->actingAs($user)
        ->get(route('open-play.show', $session))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('open-play/show')
            ->where('session.is_registration_closed', true));
});
