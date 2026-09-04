<?php

use App\Enums\Role;
use App\Models\User;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('venue admins can visit the dashboard', function () {
    $admin = User::factory()->create();
    $admin->assignRole(Role::ClubAdmin->value);

    $this->actingAs($admin);

    $this->get(route('dashboard'))->assertOk();
});

test('members cannot visit the dashboard', function () {
    // The dashboard is venue-staff only; members land on their bookings.
    $member = User::factory()->create();
    $member->assignRole(Role::Player->value);

    $this->actingAs($member);

    $this->get(route('dashboard'))->assertRedirect(route('bookings.index'));
});
