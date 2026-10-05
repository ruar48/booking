<?php

use App\Enums\Role;
use App\Http\Middleware\HandleInertiaRequests;
use App\Models\ResourceBooking;
use App\Models\User;

/**
 * Inertia can't render Laravel's plain 403 page, so bootstrap/app.php bounces
 * an Inertia visitor back with the refusal as a toast. Exercised here through a
 * member opening someone else's booking.
 */
function forbiddenInertiaHeaders(): array
{
    return [
        'X-Inertia' => 'true',
        'X-Inertia-Version' => (string) app(HandleInertiaRequests::class)->version(request()),
    ];
}

beforeEach(function () {
    $this->member = User::factory()->create();
    $this->member->assignRole(Role::Player->value);

    $this->othersBooking = ResourceBooking::factory()->create();
});

it('bounces an Inertia visitor back with a toast instead of a raw 403', function () {
    $this->actingAs($this->member)
        ->from(route('bookings.index'))
        ->withHeaders(forbiddenInertiaHeaders())
        ->get(route('bookings.show', $this->othersBooking))
        ->assertRedirect(route('bookings.index'))
        ->assertSessionHas('inertia.flash_data', [
            'toast' => ['type' => 'error', 'message' => 'This action is unauthorized.'],
        ]);
});

it('does not loop when the refused page is the one the visitor came from', function () {
    $this->actingAs($this->member)
        ->from(route('bookings.show', $this->othersBooking))
        ->withHeaders(forbiddenInertiaHeaders())
        ->get(route('bookings.show', $this->othersBooking))
        ->assertRedirect(url('/'));
});

it('still answers a plain 403 outside Inertia', function () {
    $this->actingAs($this->member)
        ->get(route('bookings.show', $this->othersBooking))
        ->assertForbidden();
});
