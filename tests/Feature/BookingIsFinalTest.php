<?php

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Enums\Role;
use App\Models\ResourceBooking;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Support\Facades\Route;
use Inertia\Testing\AssertableInertia;

/**
 * Under the venue's Payment and Booking Policy a booking is final: nobody can
 * cancel or reschedule it from the app, staff included. Unpaid bookings are
 * still released automatically by bookings:cancel-unpaid.
 */
it('has no cancel or reschedule routes', function () {
    expect(Route::has('bookings.cancel'))->toBeFalse()
        ->and(Route::has('bookings.reschedule'))->toBeFalse()
        ->and(Route::has('bookings.reschedule.edit'))->toBeFalse();
});

it('offers no cancel or reschedule action on the booking page, even to staff', function (PaymentStatus $paymentStatus) {
    $admin = User::factory()->create();
    $admin->assignRole(Role::ClubAdmin->value);

    $booking = ResourceBooking::factory()->create([
        'status' => BookingStatus::Pending,
        'payment_status' => $paymentStatus,
    ]);

    $this->actingAs($admin)
        ->get(route('bookings.show', $booking))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->missing('canReschedule')
            ->missing('canCancel'));
})->with([PaymentStatus::Unpaid, PaymentStatus::Paid]);

it('still auto-cancels an unpaid booking once its payment window passes', function () {
    Setting::query()->updateOrCreate(
        ['group' => 'bookings', 'key' => 'unpaid_cancel_minutes'],
        ['value' => 60],
    );

    $booking = ResourceBooking::factory()->create([
        'status' => BookingStatus::Pending,
        'payment_status' => PaymentStatus::Unpaid,
        'created_at' => now()->subMinutes(61),
    ]);

    $this->artisan('bookings:cancel-unpaid')->assertSuccessful();

    expect($booking->fresh()->status)->toBe(BookingStatus::Cancelled);
});
