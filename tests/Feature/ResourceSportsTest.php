<?php

use App\Enums\Role;
use App\Enums\Sport;
use App\Models\Resource;
use App\Models\User;
use Inertia\Testing\AssertableInertia;

function resourceSportsAdmin(): User
{
    $user = User::factory()->create();
    $user->assignRole(Role::ClubAdmin->value);

    return $user;
}

it('counts resources per sport in enum order, including sports with none', function () {
    Resource::factory()->count(2)->create(['sport' => Sport::Pickleball]);
    Resource::factory()->create(['sport' => Sport::Billiards, 'resource_number' => '1']);
    Resource::factory()->create(['sport' => Sport::PickleRange, 'resource_number' => '1']);

    $this->actingAs(resourceSportsAdmin())
        ->get(route('resources.index'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('stats.total', 4)
            ->where('stats.by_sport', [
                'pickleball' => 2,
                'billiards' => 1,
                'table_tennis' => 0,
                'pickle_range' => 1,
            ]));
});

it('accepts the new sports when creating a resource', function (Sport $sport) {
    $this->actingAs(resourceSportsAdmin())
        ->post(route('resources.store'), [
            'sport' => $sport->value,
            'name' => $sport->label().' 1',
            'resource_number' => '1',
            'hourly_rate' => 15,
        ])
        ->assertSessionHasNoErrors();

    expect(Resource::query()->where('sport', $sport)->count())->toBe(1);
})->with([Sport::TableTennis, Sport::PickleRange]);
