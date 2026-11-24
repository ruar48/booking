<?php

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Enums\Role;
use App\Models\Payment;
use App\Models\ResourceBooking;
use App\Models\User;
use App\Services\RevenueReportService;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia;

/**
 * Venue staff can cancel a booking; customers cannot. Cancelling only changes
 * the status — any refund is done by staff manually — and the revenue
 * figures drop the cancelled amount.
 */
function cancelTestUser(Role $role): User
{
    $user = User::factory()->create();
    $user->assignRole($role->value);

    return $user;
}

it('lets an admin cancel a booking and offers the action on the booking page', function () {
    $admin = cancelTestUser(Role::ClubAdmin);
    $booking = ResourceBooking::factory()->create(['status' => BookingStatus::Approved]);

    $this->actingAs($admin)
        ->get(route('bookings.show', $booking))
        ->assertInertia(fn (AssertableInertia $page) => $page->where('canCancel', true));

    $this->actingAs($admin)
        ->patch(route('bookings.cancel', $booking), ['reason' => 'Rained out'])
        ->assertRedirect(route('bookings.show', $booking));

    $booking->refresh();

    expect($booking->status)->toBe(BookingStatus::Cancelled)
        ->and($booking->cancellation_reason)->toBe('Rained out');
});

it('does not let a customer cancel, even their own booking', function () {
    $player = cancelTestUser(Role::Player);
    $booking = ResourceBooking::factory()->create([
        'user_id' => $player->id,
        'status' => BookingStatus::Pending,
    ]);

    $this->actingAs($player)
        ->patch(route('bookings.cancel', $booking))
        ->assertForbidden();

    expect($booking->fresh()->status)->toBe(BookingStatus::Pending);
});

it('will not cancel a booking that is already cancelled or completed', function (BookingStatus $status) {
    $booking = ResourceBooking::factory()->create(['status' => $status]);

    $this->actingAs(cancelTestUser(Role::ClubAdmin))
        ->patch(route('bookings.cancel', $booking))
        ->assertForbidden();
})->with([BookingStatus::Cancelled, BookingStatus::Completed, BookingStatus::Rejected]);

it('deducts cancelled walk-in bookings from revenue', function () {
    $admin = cancelTestUser(Role::ClubAdmin);
    $customer = User::factory()->create();

    $walkIns = ResourceBooking::factory()->count(2)->create([
        'user_id' => $customer->id,
        'created_by' => $admin->id,
        'status' => BookingStatus::Approved,
        'payment_status' => PaymentStatus::Paid,
        'amount' => 250,
        'starts_at' => now()->addDays(4)->setTime(20, 0),
        'ends_at' => now()->addDays(4)->setTime(21, 0),
    ]);

    $todayWalkIns = fn () => app(RevenueReportService::class)->summary()['day']['current']['walk_in'];

    // Counted today, when the cash was taken, not on the day they play.
    expect($todayWalkIns())->toBe(500.0);

    foreach ($walkIns as $booking) {
        $this->actingAs($admin)->patch(route('bookings.cancel', $booking))->assertRedirect();
    }

    expect($todayWalkIns())->toBe(0.0);
});

it('only cancels: payment is left untouched for staff to refund by hand', function () {
    $booking = ResourceBooking::factory()->create([
        'status' => BookingStatus::Approved,
        'payment_status' => PaymentStatus::Paid,
        'amount' => 300,
    ]);

    $payment = Payment::factory()->create([
        'user_id' => $booking->user_id,
        'payable_type' => $booking->getMorphClass(),
        'payable_id' => $booking->id,
        'invoice_number' => 'INV-TEST-'.Str::upper(Str::random(8)),
        'amount' => 300,
        'status' => PaymentStatus::Paid,
        'payment_method' => 'qrph',
        'paid_at' => now(),
    ]);

    $this->actingAs(cancelTestUser(Role::ClubAdmin))
        ->patch(route('bookings.cancel', $booking))
        ->assertRedirect();

    expect($booking->fresh()->status)->toBe(BookingStatus::Cancelled)
        ->and($booking->fresh()->payment_status)->toBe(PaymentStatus::Paid)
        ->and($payment->fresh()->status)->toBe(PaymentStatus::Paid)
        ->and($payment->fresh()->flagged_at)->toBeNull();
});
