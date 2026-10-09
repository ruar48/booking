<?php

use App\Enums\Role;
use App\Models\Player;
use App\Models\Product;
use App\Models\Resource;
use App\Models\ResourceBooking;
use App\Models\User;

/**
 * The delete buttons on the Resources, Inventory and Members lists. Each is a
 * soft delete, so history that points at the row (bookings, sales) survives.
 */
function adminDeleteUser(Role $role): User
{
    $user = User::factory()->create();
    $user->assignRole($role->value);

    return $user;
}

it('lets an admin delete a resource and keeps its bookings', function () {
    $resource = Resource::factory()->create();
    $booking = ResourceBooking::factory()->create(['resource_id' => $resource->id]);

    $this->actingAs(adminDeleteUser(Role::ClubAdmin))
        ->delete(route('resources.destroy', $resource))
        ->assertRedirect(route('resources.index'));

    expect($resource->fresh()->trashed())->toBeTrue()
        ->and($booking->fresh())->not->toBeNull();
});

it('lets an admin delete a product', function () {
    $product = Product::factory()->create();

    $this->actingAs(adminDeleteUser(Role::ClubAdmin))
        ->delete(route('products.destroy', $product))
        ->assertRedirect(route('products.index'));

    expect($product->fresh()->trashed())->toBeTrue();
});

it('lets an admin delete a member profile but keeps the login account', function () {
    $player = Player::factory()->create();

    $this->actingAs(adminDeleteUser(Role::ClubAdmin))
        ->delete(route('players.destroy', $player))
        ->assertRedirect(route('players.index'));

    expect($player->fresh()->trashed())->toBeTrue()
        ->and($player->user->fresh())->not->toBeNull();
});

it('does not let a player delete anything', function () {
    $player = adminDeleteUser(Role::Player);
    $resource = Resource::factory()->create();

    // The venue.admin middleware turns non-admins away before the policy runs.
    $this->actingAs($player)
        ->delete(route('resources.destroy', $resource))
        ->assertRedirect();

    expect($resource->fresh()->trashed())->toBeFalse();
});
