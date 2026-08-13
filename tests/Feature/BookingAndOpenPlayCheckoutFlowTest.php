<?php

use App\Enums\ResourceStatus;
use App\Enums\Role as RoleEnum;
use App\Enums\Sport;
use App\Enums\TeamSize;
use App\Models\DateOverride;
use App\Models\OpenPlaySession;
use App\Models\Payment;
use App\Models\Player;
use App\Models\Resource;
use App\Models\ResourceBooking;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Testing\TestResponse;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

/**
 * Simulates a real PayMongo QR Ph flow end-to-end so we can be confident the
 * live/production integration (Hostinger) will actually work: real routes,
 * real controllers/policies, real DB writes — only the outbound HTTP calls to
 * api.paymongo.com and the inbound webhook signature are faked, exactly the
 * two things that differ between local/test and a real PayMongo account.
 */
function fakePaymongoGateway(bool $includeExpiresAt = true): void
{
    config([
        'services.paymongo.secret_key' => 'sk_test_fake',
        'services.paymongo.public_key' => 'pk_test_fake',
        'services.paymongo.webhook_secret' => 'whsec_fake',
    ]);

    $code = ['image_url' => 'https://api.paymongo.com/qr/test.png'];

    if ($includeExpiresAt) {
        // Real PayMongo sends expires_at as an ISO8601 string, not a Unix
        // timestamp — mocking it as anything else lets a regression like
        // that slip past this test.
        $code['expires_at'] = now()->addMinutes(15)->toIso8601String();
    }

    Http::fake([
        'api.paymongo.com/v1/payment_intents' => Http::response([
            'data' => [
                'id' => 'pi_test_123',
                'attributes' => ['client_key' => 'pi_test_123_client_key'],
            ],
        ]),
        'api.paymongo.com/v1/payment_methods' => Http::response([
            'data' => ['id' => 'pm_test_123'],
        ]),
        'api.paymongo.com/v1/payment_intents/*/attach' => Http::response([
            'data' => [
                'attributes' => [
                    'next_action' => [
                        'code' => $code,
                    ],
                ],
            ],
        ]),
    ]);
}

/**
 * livemode: true reproduces PayMongo's real header shape for a live payment
 * - t=<ts>,te=,li=<signature> - te= is present but EMPTY, and the real
 * signature is in li=. This is what tripped up production: the code required
 * te to be non-empty before ever checking li.
 */
function postPaymongoWebhook(string $paymentIntentId, bool $livemode = false): TestResponse
{
    $secret = config('services.paymongo.webhook_secret');
    $timestamp = time();

    $payload = [
        'data' => [
            'attributes' => [
                'type' => 'payment_intent.succeeded',
                'data' => ['id' => $paymentIntentId],
            ],
        ],
    ];

    $body = json_encode($payload);
    $signature = hash_hmac('sha256', $timestamp.'.'.$body, $secret);

    $header = $livemode
        ? "t={$timestamp},te=,li={$signature}"
        : "t={$timestamp},te={$signature},li=";

    return test()->postJson('/webhooks/paymongo', $payload, [
        'Paymongo-Signature' => $header,
    ]);
}

function playerUser(): User
{
    Role::findOrCreate(RoleEnum::Player->value, 'web');

    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole(RoleEnum::Player->value);

    return $user;
}

it('lets a customer book a court, pay via QR Ph, and see the booking confirmed', function () {
    fakePaymongoGateway();

    $user = playerUser();
    $resource = Resource::factory()->create([
        'sport' => Sport::Pickleball,
        'status' => ResourceStatus::Available,
        'hourly_rate' => 500,
    ]);

    $startsAt = now()->addDay()->setTime(10, 0);
    $endsAt = $startsAt->clone()->addHour();

    DateOverride::query()->create([
        'date' => $startsAt->toDateString(),
        'is_closed' => false,
        'open_time' => '08:00',
        'close_time' => '22:00',
    ]);

    $this->actingAs($user);

    // Step 1: create the booking.
    $this->post(route('bookings.store'), [
        'resource_id' => $resource->id,
        'starts_at' => $startsAt->toDateTimeString(),
        'ends_at' => $endsAt->toDateTimeString(),
    ])->assertRedirect();

    $booking = ResourceBooking::query()->where('resource_id', $resource->id)->firstOrFail();

    expect($booking->status->value)->toBe('pending')
        ->and($booking->payment_status->value)->toBe('unpaid');

    // Step 2: land on checkout.
    $this->get(route('bookings.checkout', $booking))->assertOk();

    // Step 3: generate the QR Ph payment (hits the faked PayMongo gateway).
    $this->post(route('bookings.checkout.generate', $booking), [
        'payment_method' => 'qrph',
    ])->assertOk();

    $payment = Payment::query()
        ->where('payable_type', ResourceBooking::class)
        ->where('payable_id', $booking->id)
        ->latest()
        ->firstOrFail();

    expect($payment->qr_code_url)->toBe('https://api.paymongo.com/qr/test.png')
        ->and($payment->paymongo_payment_intent_id)->toBe('pi_test_123')
        ->and($payment->status->value)->toBe('pending');

    // Regression: PayMongo sends expires_at as an ISO8601 string. Parsing it
    // as if it were a Unix timestamp truncates it to its leading digits and
    // yields a near-epoch-zero date, making the QR look expired the instant
    // it's generated.
    expect($payment->qr_expires_at->isFuture())->toBeTrue()
        ->and($payment->qr_expires_at->diffInMinutes(now()))->toBeLessThan(16);

    // Step 4: PayMongo notifies us the QR was scanned and paid.
    postPaymongoWebhook($payment->paymongo_payment_intent_id)->assertOk();

    $booking->refresh();

    expect($booking->payment_status->value)->toBe('paid')
        ->and($booking->status->value)->toBe('approved');

    // Step 5: checkout page now renders with the props that drive the
    // frontend's confirmation step (isPaid -> step 4).
    $this->get(route('bookings.checkout', $booking))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('booking.payment_status', 'paid')
            ->where('booking.status', 'approved')
        );
});

it('charges the full total for a multi-slot bulk booking, not just the first run', function () {
    // Regression test: selecting several non-contiguous hours (or several
    // courts) in one submission creates one ResourceBooking row per run, but
    // checkout used to operate on only the first row returned from
    // storeBulk() — silently dropping the rest of the customer's hours from
    // the QR payment amount. booking_group_id ties the rows together so
    // checkout totals and pays them all.
    fakePaymongoGateway();

    $user = playerUser();
    $resource = Resource::factory()->create([
        'sport' => Sport::Pickleball,
        'status' => ResourceStatus::Available,
        'hourly_rate' => 1,
    ]);

    $day = now()->addDay();

    DateOverride::query()->create([
        'date' => $day->toDateString(),
        'is_closed' => false,
        'open_time' => '08:00',
        'close_time' => '22:00',
    ]);

    $this->actingAs($user);

    // Two non-contiguous runs: 9-12 (3h) and 14-18 (4h) = 7 total hours.
    $firstRun = ['starts_at' => $day->clone()->setTime(9, 0), 'ends_at' => $day->clone()->setTime(12, 0)];
    $secondRun = ['starts_at' => $day->clone()->setTime(14, 0), 'ends_at' => $day->clone()->setTime(18, 0)];

    $this->post(route('bookings.store-bulk'), [
        'bookings' => [
            [
                'resource_id' => $resource->id,
                'starts_at' => $firstRun['starts_at']->toDateTimeString(),
                'ends_at' => $firstRun['ends_at']->toDateTimeString(),
            ],
            [
                'resource_id' => $resource->id,
                'starts_at' => $secondRun['starts_at']->toDateTimeString(),
                'ends_at' => $secondRun['ends_at']->toDateTimeString(),
            ],
        ],
    ])->assertRedirect();

    $bookings = ResourceBooking::query()->where('resource_id', $resource->id)->orderBy('starts_at')->get();

    expect($bookings)->toHaveCount(2)
        ->and((float) $bookings[0]->amount)->toBe(3.0)
        ->and((float) $bookings[1]->amount)->toBe(4.0)
        ->and($bookings[0]->booking_group_id)->not->toBeNull()
        ->and($bookings[0]->booking_group_id)->toBe($bookings[1]->booking_group_id);

    $primary = $bookings[0];

    // Checkout must reflect the group total, not just this row's amount.
    $this->get(route('bookings.checkout', $primary))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('groupTotalAmount', 7));

    $this->post(route('bookings.checkout.generate', $primary), [
        'payment_method' => 'qrph',
    ])->assertOk();

    $payment = Payment::query()
        ->where('payable_type', ResourceBooking::class)
        ->where('payable_id', $primary->id)
        ->latest()
        ->firstOrFail();

    // This is the core of the bug: the QR must be for ₱7, not ₱3.
    expect((float) $payment->amount)->toBe(7.0);

    // Paying the primary booking's QR marks the whole group paid.
    postPaymongoWebhook($payment->paymongo_payment_intent_id)->assertOk();

    foreach ($bookings as $booking) {
        $booking->refresh();
        expect($booking->payment_status->value)->toBe('paid')
            ->and($booking->status->value)->toBe('approved');
    }
});

it('lets a customer join a paid open play session, pay via QR Ph, and get registered', function () {
    fakePaymongoGateway();

    $user = playerUser();
    Player::factory()->for($user)->create();
    $session = OpenPlaySession::factory()->create([
        'team_size' => TeamSize::Singles,
        'price_per_player' => 150,
        'max_players' => 16,
        'starts_at' => now()->addDays(3),
        'ends_at' => now()->addDays(3)->addHours(2),
    ]);

    $this->actingAs($user);

    // Step 1: register for the session — creates an unpaid registration and
    // redirects to checkout since the session isn't free.
    $this->post(route('open-play.join.store', $session))->assertRedirect(route('open-play.checkout', $session));

    $player = Player::query()->where('user_id', $user->id)->firstOrFail();
    $registration = $session->registrations()->where('player_id', $player->id)->firstOrFail();

    expect($registration->payment_status->value)->toBe('unpaid')
        ->and((float) $registration->amount)->toBe(150.0);

    // Step 2: land on checkout.
    $this->get(route('open-play.checkout', $session))->assertOk();

    // Step 3: generate the QR Ph payment.
    $this->post(route('open-play.checkout.generate', $session), [
        'payment_method' => 'qrph',
    ])->assertOk();

    $payment = Payment::query()
        ->where('payable_type', $registration->getMorphClass())
        ->where('payable_id', $registration->id)
        ->latest()
        ->firstOrFail();

    expect($payment->qr_code_url)->toBe('https://api.paymongo.com/qr/test.png')
        ->and($payment->paymongo_payment_intent_id)->toBe('pi_test_123')
        ->and($payment->qr_expires_at->isFuture())->toBeTrue()
        ->and($payment->qr_expires_at->diffInMinutes(now()))->toBeLessThan(16);

    // Step 4: PayMongo notifies us the QR was scanned and paid.
    postPaymongoWebhook($payment->paymongo_payment_intent_id)->assertOk();

    $registration->refresh();

    expect($registration->payment_status->value)->toBe('paid');

    // Step 5: back on checkout, the props that drive the frontend's
    // confirmation step (isPaid -> step 3) reflect the paid registration.
    $this->get(route('open-play.checkout', $session))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('registration.payment_status', 'paid'));

    // And the player now shows as registered when browsing/joining again.
    $this->get(route('open-play.join', $session))->assertOk();
});

it('keeps showing the same pending QR Ph payment across a refresh, even when PayMongo omits expires_at', function () {
    // Regression test: qr_expires_at used to be stored as null whenever
    // PayMongo's response didn't include an expires_at for the QR code,
    // which made showCheckout()'s "reuse the still-valid pending payment"
    // lookup (filtered on qr_expires_at > now()) never match — silently
    // forcing a brand-new Payment/QR to be generated on every page refresh.
    fakePaymongoGateway(includeExpiresAt: false);

    $user = playerUser();
    $resource = Resource::factory()->create([
        'sport' => Sport::Pickleball,
        'status' => ResourceStatus::Available,
        'hourly_rate' => 500,
    ]);

    $startsAt = now()->addDay()->setTime(10, 0);
    $endsAt = $startsAt->clone()->addHour();

    DateOverride::query()->create([
        'date' => $startsAt->toDateString(),
        'is_closed' => false,
        'open_time' => '08:00',
        'close_time' => '22:00',
    ]);

    $this->actingAs($user);

    $this->post(route('bookings.store'), [
        'resource_id' => $resource->id,
        'starts_at' => $startsAt->toDateTimeString(),
        'ends_at' => $endsAt->toDateTimeString(),
    ])->assertRedirect();

    $booking = ResourceBooking::query()->where('resource_id', $resource->id)->firstOrFail();

    $this->post(route('bookings.checkout.generate', $booking), [
        'payment_method' => 'qrph',
    ])->assertOk();

    $payment = Payment::query()->where('payable_id', $booking->id)->firstOrFail();

    expect($payment->qr_expires_at)->not->toBeNull()
        ->and($payment->qr_expires_at->isFuture())->toBeTrue();

    // Simulate a browser refresh landing back on the checkout page.
    $this->get(route('bookings.checkout', $booking))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('qrPayment.id', $payment->id));

    // Still only the one payment/QR — refreshing must not have generated a
    // second one.
    expect(Payment::query()->where('payable_id', $booking->id)->count())->toBe(1);
});
