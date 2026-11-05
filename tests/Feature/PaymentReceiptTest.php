<?php

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Enums\ResourceStatus;
use App\Enums\Role as RoleEnum;
use App\Enums\Sport;
use App\Enums\TeamSize;
use App\Models\OpenPlayRegistration;
use App\Models\OpenPlaySession;
use App\Models\Payment;
use App\Models\Player;
use App\Models\Resource;
use App\Models\ResourceBooking;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

/**
 * The e-receipt printed on the checkout confirmation step. It is a view of
 * the Payment that actually settled the booking, so these pin down which
 * payment that is and that nothing is printed without one.
 */
function receiptCustomer(): User
{
    Role::findOrCreate(RoleEnum::Player->value, 'web');

    $user = User::factory()->create([
        'name' => 'Ana Reyes',
        'phone' => '09171234567',
        'email_verified_at' => now(),
    ]);
    $user->assignRole(RoleEnum::Player->value);

    return $user;
}

/**
 * @param  array<string, mixed>  $attributes
 */
function receiptBooking(User $owner, Resource $court, int $hour, array $attributes = []): ResourceBooking
{
    $startsAt = now()->addDay()->setTime($hour, 0);

    return ResourceBooking::factory()->for($owner)->for($court, 'resource')->create([
        'starts_at' => $startsAt,
        'ends_at' => $startsAt->clone()->addHour(),
        'amount' => 500,
        'status' => BookingStatus::Approved,
        'payment_status' => PaymentStatus::Paid,
        ...$attributes,
    ]);
}

/**
 * @param  array<string, mixed>  $attributes
 */
function receiptPayment(Model $payable, User $payer, array $attributes = []): Payment
{
    return Payment::factory()->create([
        'user_id' => $payer->id,
        'payable_type' => $payable->getMorphClass(),
        'payable_id' => $payable->getKey(),
        'invoice_number' => 'INV-TEST-'.Str::upper(Str::random(8)),
        'amount' => 515,
        'convenience_fee' => 15,
        'currency' => 'PHP',
        'status' => PaymentStatus::Paid,
        'payment_method' => 'qrph',
        'paid_at' => now(),
        ...$attributes,
    ]);
}

function receiptCourt(): Resource
{
    return Resource::factory()->create([
        'name' => 'Court 1',
        'sport' => Sport::Pickleball,
        'status' => ResourceStatus::Available,
        'hourly_rate' => 500,
    ]);
}

it('prints nothing until the booking is paid, then the payment that settled it', function () {
    // A migration seeds the real venue's profile; pin it so the name falls
    // back to the app name the way the emailed receipt does.
    Setting::query()->updateOrCreate(
        ['group' => 'venue', 'key' => 'profile'],
        ['value' => ['city' => 'Binalonan', 'state' => 'Pangasinan']],
    );

    $ana = receiptCustomer();
    $booking = receiptBooking($ana, receiptCourt(), 18, [
        'status' => BookingStatus::Pending,
        'payment_status' => PaymentStatus::Unpaid,
    ]);

    $this->actingAs($ana)
        ->get(route('bookings.checkout', $booking))
        ->assertInertia(fn ($page) => $page->where('receipt', null));

    $booking->update(['status' => BookingStatus::Approved, 'payment_status' => PaymentStatus::Paid]);
    $payment = receiptPayment($booking, $ana);

    $this->get(route('bookings.checkout', $booking))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('receipt.reference', $payment->invoice_number)
            ->where('receipt.venue.name', config('app.name'))
            ->where('receipt.venue.address', 'Binalonan, Pangasinan')
            ->where('receipt.title', 'Pickleball · Court 1')
            ->where('receipt.customer.name', 'Ana Reyes')
            ->where('receipt.customer.phone', '09171234567')
            ->where('receipt.method', 'QR Ph')
            ->where('receipt.subtotal', 500)
            ->where('receipt.fee', 15)
            ->where('receipt.total', 515)
            ->has('receipt.items', 1)
            ->where('receipt.items.0.label', 'Court 1')
            ->where('receipt.items.0.players', null)
            ->where('receipt.items.0.amount', 500)
            ->where('receipt.verify_url', route('payments.show', $payment)));
});

it('arrives in the same partial reload that reveals the payment', function () {
    $ana = receiptCustomer();
    $booking = receiptBooking($ana, receiptCourt(), 18);
    $payment = receiptPayment($booking, $ana);

    // What the checkout's websocket listener and poll ask for once paid.
    $this->actingAs($ana)
        ->get(route('bookings.checkout', $booking))
        ->assertInertia(fn ($page) => $page->reloadOnly(['booking', 'receipt'], fn ($reload) => $reload
            ->where('booking.payment_status', 'paid')
            ->where('receipt.reference', $payment->invoice_number)));
});

it('finds a group payment from any of its slots and skips a duplicate flagged for refund', function () {
    $ana = receiptCustomer();
    $court = receiptCourt();
    $group = (string) Str::uuid();
    $first = receiptBooking($ana, $court, 18, ['booking_group_id' => $group]);
    $second = receiptBooking($ana, $court, 19, ['booking_group_id' => $group, 'amount' => 600]);

    $settled = receiptPayment($first, $ana, ['amount' => 1100, 'convenience_fee' => 0]);
    // Her phone had queued a second scan: paid later, flagged, to be refunded.
    receiptPayment($first, $ana, [
        'amount' => 1100,
        'convenience_fee' => 0,
        'paid_at' => now()->addMinute(),
        'flagged_at' => now()->addMinute(),
    ]);

    $this->actingAs($ana)
        ->get(route('bookings.checkout', $second))
        ->assertInertia(fn ($page) => $page
            ->where('receipt.reference', $settled->invoice_number)
            ->where('receipt.title', 'Pickleball · 2 slots')
            ->has('receipt.items', 2)
            ->where('receipt.items.0.amount', 500)
            ->where('receipt.items.1.amount', 600)
            ->where('receipt.fee', 0)
            ->where('receipt.total', 1100));
});

it('prints no receipt for a booking marked paid at the desk', function () {
    $ana = receiptCustomer();
    $booking = receiptBooking($ana, receiptCourt(), 18);

    $this->actingAs($ana)
        ->get(route('bookings.checkout', $booking))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('booking.payment_status', 'paid')
            ->where('receipt', null));
});

it('never shows a stranger the receipt for someone else\'s booking', function () {
    $ana = receiptCustomer();
    $booking = receiptBooking($ana, receiptCourt(), 18);
    receiptPayment($booking, $ana);

    $mallory = User::factory()->create(['email_verified_at' => now()]);
    $mallory->assignRole(RoleEnum::Player->value);

    $this->actingAs($mallory)->get(route('bookings.checkout', $booking))->assertForbidden();
});

it('prints the open play receipt for the whole party, under the venue from settings', function () {
    Setting::query()->updateOrCreate(
        ['group' => 'venue', 'key' => 'profile'],
        ['value' => ['name' => 'CNA Pickleball', 'city' => 'Binalonan', 'state' => 'Pangasinan']],
    );

    $ana = receiptCustomer();
    $player = Player::factory()->for($ana)->create(['birthdate' => '1995-05-05']);
    $session = OpenPlaySession::factory()->create([
        'title' => 'Friday Social',
        'team_size' => TeamSize::Singles,
        'price_per_player' => 150,
        'starts_at' => now()->addDays(2),
        'ends_at' => now()->addDays(2)->addHours(2),
    ]);

    $lead = OpenPlayRegistration::query()->create([
        'open_play_session_id' => $session->id,
        'player_id' => $player->id,
        'payment_status' => PaymentStatus::Paid,
        'amount' => 450,
    ]);

    foreach (Player::factory()->count(2)->create() as $friend) {
        OpenPlayRegistration::query()->create([
            'open_play_session_id' => $session->id,
            'player_id' => $friend->id,
            'group_lead_id' => $lead->id,
            'payment_status' => PaymentStatus::Paid,
            'amount' => 0,
        ]);
    }

    $payment = receiptPayment($lead, $ana, ['amount' => 450, 'convenience_fee' => 0]);

    $this->actingAs($ana)
        ->get(route('open-play.checkout', $session))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('receipt.reference', $payment->invoice_number)
            ->where('receipt.venue.name', 'CNA Pickleball')
            ->where('receipt.venue.address', 'Binalonan, Pangasinan')
            ->where('receipt.title', 'Open Play · Friday Social')
            ->where('receipt.customer.name', 'Ana Reyes')
            ->has('receipt.items', 1)
            ->where('receipt.items.0.players', 3)
            ->where('receipt.items.0.amount', 450)
            ->where('receipt.total', 450));
});
