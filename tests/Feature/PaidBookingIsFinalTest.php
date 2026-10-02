<?php

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Enums\Role;
use App\Models\Resource;
use App\Models\ResourceBooking;
use App\Models\User;
use Inertia\Testing\AssertableInertia;

/**
 * Under the venue's Payment and Booking Policy a paid booking is final: it can
 * be neither cancelled nor moved, by the member or by staff.
 */
function paidBookingUser(Role $role): User
{
    $user = User::factory()->create();
    $user->assignRole($role->value);

    return $user;
}

beforeEach(function () {
    $this->member = paidBookingUser(Role::Player);
    $this->admin = paidBookingUser(Role::ClubAdmin);

    $startsAt = now()->addDays(6)->setTime(9, 0);

    $this->booking = ResourceBooking::factory()->create([
        'user_id' => $this->member->id,
        'resource_id' => Resource::factory()->create()->id,
        'starts_at' => $startsAt,
        'ends_at' => $startsAt->clone()->addHour(),
        'status' => BookingStatus::Approved,
        'payment_status' => PaymentStatus::Paid,
    ]);
});

it('offers neither reschedule nor cancel on a paid booking, to staff or the member', function (string $viewer) {
    $this->actingAs($this->{$viewer})
        ->get(route('bookings.show', $this->booking))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('canReschedule', false)
            ->where('canCancel', false));
})->with(['member', 'admin']);

it('refuses to cancel a paid booking even for staff', function () {
    $this->actingAs($this->admin)
        ->patch(route('bookings.cancel', $this->booking))
        ->assertForbidden();

    expect($this->booking->fresh()->status)->toBe(BookingStatus::Approved);
});

it('refuses to reschedule a paid booking even for staff', function () {
    $this->actingAs($this->admin)
        ->get(route('bookings.reschedule.edit', $this->booking))
        ->assertForbidden();
});

it('still lets staff cancel an unpaid booking', function () {
    $this->booking->update(['payment_status' => PaymentStatus::Unpaid]);

    $this->actingAs($this->admin)
        ->patch(route('bookings.cancel', $this->booking))
        ->assertRedirect();

    expect($this->booking->fresh()->status)->toBe(BookingStatus::Cancelled);
});
