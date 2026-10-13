<?php

use App\Enums\Role as RoleEnum;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

it('shows the branded 404 page for an unknown URL', function () {
    $this->withoutVite()
        ->get('/this-page-does-not-exist')
        ->assertNotFound()
        ->assertInertia(fn ($page) => $page
            ->component('errors/not-found')
            ->where('auth.user', null));
});

it('knows who is signed in on the 404 page, so it can link them home', function () {
    Role::findOrCreate(RoleEnum::Player->value, 'web');
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole(RoleEnum::Player->value);

    $this->withoutVite()
        ->actingAs($user)
        ->get('/nope/nothing-here')
        ->assertNotFound()
        ->assertInertia(fn ($page) => $page
            ->component('errors/not-found')
            ->where('auth.user.id', $user->id));
});

it('shows the 404 page when a record does not exist', function () {
    Role::findOrCreate(RoleEnum::Player->value, 'web');
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole(RoleEnum::Player->value);

    $this->withoutVite()
        ->actingAs($user)
        ->get('/open-play/999999/join')
        ->assertNotFound()
        ->assertInertia(fn ($page) => $page->component('errors/not-found'));
});

it('does not serve the Inertia page to JSON callers', function () {
    $response = $this->getJson('/this-page-does-not-exist')->assertNotFound();

    expect($response->getContent())->not->toContain('errors/not-found');
});
