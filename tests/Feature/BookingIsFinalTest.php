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
 * Under the venue's Payment and Booking Policy a booking is final for the
 * customer: they cannot cancel or reschedule it from the app. Venue staff can
 * cancel (see AdminCancelBookingTest); nobody can reschedule. Unpaid bookings
 * are still released automatically by bookings:cancel-unpaid.
 */
it('has no reschedule routes', function () {
    expect(Route::has('bookings.reschedule'))->toBeFalse()
        ->and(Route::has('bookings.reschedule.edit'))->toBeFalse();
});

it('offers the customer no cancel or reschedule action on their booking page', function (PaymentStatus $paymentStatus) {
    $player = User::factory()->create();
    $player->assignRole(Role::Player->value);

    $booking = ResourceBooking::factory()->create([
        'user_id' => $player->id,
        'status' => BookingStatus::Pending,
        'payment_status' => $paymentStatus,
    ]);

    $this->actingAs($player)
        ->get(route('bookings.show', $booking))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->missing('canReschedule')
            ->where('canCancel', false));
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
