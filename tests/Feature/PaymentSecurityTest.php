<?php

use App\Enums\BookingStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\ResourceStatus;
use App\Enums\Role as RoleEnum;
use App\Enums\Sport;
use App\Enums\TeamSize;
use App\Events\PaymentSuccessful;
use App\Models\DateOverride;
use App\Models\OpenPlayRegistration;
use App\Models\OpenPlaySession;
use App\Models\Payment;
use App\Models\Player;
use App\Models\Resource;
use App\Models\ResourceBooking;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\Client\Factory as HttpFactory;
use Illuminate\Http\Client\Request as HttpRequest;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;
use Illuminate\Testing\TestResponse;
use Spatie\Permission\Models\Role;

/**
 * Every way a customer, a stranger, PayMongo or the clock can push on the
 * payment flow. The rule throughout: money received is never lost or
 * double-counted, money is never taken for something that can't be honoured,
 * and no failure leaves the checkout page stuck.
 */
function secGateway(array $overrides = []): void
{
    config([
        'services.paymongo.secret_key' => 'sk_test_fake',
        'services.paymongo.webhook_secret' => 'whsec_fake',
        'services.paymongo.fee_percent' => 0,
        'services.paymongo.fee_fixed' => 0,
    ]);

    // Http::fake() keeps earlier stubs ahead of later ones, so an override
    // needs a clean factory to take effect.
    if ($overrides !== []) {
        Http::swap(new HttpFactory);
    }

    Http::fake($overrides + [
        'api.paymongo.com/v1/payment_intents' => Http::sequence()
            ->push(['data' => ['id' => 'pi_sec_1', 'attributes' => ['client_key' => 'ck_1']]])
            ->push(['data' => ['id' => 'pi_sec_2', 'attributes' => ['client_key' => 'ck_2']]])
            ->push(['data' => ['id' => 'pi_sec_3', 'attributes' => ['client_key' => 'ck_3']]]),
        'api.paymongo.com/v1/payment_methods' => Http::response(['data' => ['id' => 'pm_sec']]),
        'api.paymongo.com/v1/payment_intents/*/attach' => Http::response([
            'data' => ['attributes' => ['next_action' => ['code' => [
                'image_url' => 'https://api.paymongo.com/qr/sec.png',
                'expires_at' => now()->addMinutes(15)->toIso8601String(),
            ]]]],
        ]),
    ]);
}

function secIntentCalls(): int
{
    return Http::recorded(fn (HttpRequest $request) => str_ends_with($request->url(), '/v1/payment_intents'))->count();
}

/**
 * @param  array<string, mixed>  $payload
 */
function secWebhook(array $payload, ?string $header = null): TestResponse
{
    $body = json_encode($payload);

    if ($header === null) {
        $timestamp = time();
        $signature = hash_hmac('sha256', $timestamp.'.'.$body, 'whsec_fake');
        $header = "t={$timestamp},te={$signature},li=";
    }

    return test()->call('POST', '/webhooks/paymongo', [], [], [], [
        'CONTENT_TYPE' => 'application/json',
        'HTTP_ACCEPT' => 'application/json',
        'HTTP_PAYMONGO_SIGNATURE' => $header,
    ], $body);
}

/**
 * @return array<string, mixed>
 */
function secPaidPayload(string $intentId, ?int $amountCentavos, string $type = 'payment_intent.succeeded'): array
{
    $attributes = $amountCentavos === null ? [] : ['amount' => $amountCentavos];

    return ['data' => ['attributes' => [
        'type' => $type,
        'data' => $type === 'payment.paid'
            ? ['id' => 'pay_x', 'attributes' => $attributes + ['payment_intent_id' => $intentId]]
            : ['id' => $intentId, 'attributes' => $attributes],
    ]]];
}

function secUser(RoleEnum $role = RoleEnum::Player): User
{
    Role::findOrCreate($role->value, 'web');

    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole($role->value);

    return $user;
}

/**
 * A pending, unpaid ₱500 booking tomorrow 10–11am on an open date.
 */
function secBooking(?User $owner = null, array $attributes = []): ResourceBooking
{
    $startsAt = now()->addDay()->setTime(10, 0);

    DateOverride::query()->firstOrCreate(
        ['date' => $startsAt->toDateString()],
        ['is_closed' => false, 'open_time' => '08:00', 'close_time' => '22:00'],
    );

    return ResourceBooking::factory()->create([
        'resource_id' => Resource::factory()->create([
            'sport' => Sport::Pickleball,
            'status' => ResourceStatus::Available,
        ])->id,
        'user_id' => ($owner ?? secUser())->id,
        'starts_at' => $startsAt,
        'ends_at' => $startsAt->clone()->addHour(),
        'status' => BookingStatus::Pending,
        'payment_status' => PaymentStatus::Unpaid,
        'amount' => 500,
        ...$attributes,
    ]);
}

function secPendingPayment(ResourceBooking $booking, string $intentId, array $attributes = []): Payment
{
    return Payment::query()->create([
        'user_id' => $booking->user_id,
        'payable_type' => $booking->getMorphClass(),
        'payable_id' => $booking->id,
        'invoice_number' => 'INV-TEST-'.$intentId,
        'amount' => '500.00',
        'convenience_fee' => '0.00',
        'currency' => 'PHP',
        'status' => PaymentStatus::Pending,
        'payment_method' => PaymentMethod::Qrph->value,
        'paymongo_payment_intent_id' => $intentId,
        'qr_code_url' => 'https://api.paymongo.com/qr/sec.png',
        'qr_expires_at' => now()->addMinutes(15),
        ...$attributes,
    ]);
}

beforeEach(fn () => secGateway());

// ---------------------------------------------------------------------------
// Webhook: only PayMongo can mark anything paid.
// ---------------------------------------------------------------------------

it('rejects a webhook with no signature and pays nothing', function () {
    $booking = secBooking();
    $payment = secPendingPayment($booking, 'pi_forged');

    secWebhook(secPaidPayload('pi_forged', 50000), header: '')->assertStatus(400);

    expect($payment->fresh()->status)->toBe(PaymentStatus::Pending)
        ->and($booking->fresh()->payment_status)->toBe(PaymentStatus::Unpaid);
});

it('rejects a webhook signed with the wrong secret', function () {
    $booking = secBooking();
    $payment = secPendingPayment($booking, 'pi_forged');
    $payload = secPaidPayload('pi_forged', 50000);
    $timestamp = time();
    $signature = hash_hmac('sha256', $timestamp.'.'.json_encode($payload), 'attacker_guess');

    secWebhook($payload, "t={$timestamp},te={$signature},li={$signature}")->assertStatus(400);

    expect($payment->fresh()->status)->toBe(PaymentStatus::Pending);
});

it('rejects a genuine signature replayed onto a tampered body', function () {
    $booking = secBooking();
    $payment = secPendingPayment($booking, 'pi_real');
    $timestamp = time();
    $signature = hash_hmac('sha256', $timestamp.'.'.json_encode(secPaidPayload('pi_other', 100)), 'whsec_fake');

    secWebhook(secPaidPayload('pi_real', 50000), "t={$timestamp},te={$signature},li=")->assertStatus(400);

    expect($payment->fresh()->status)->toBe(PaymentStatus::Pending);
});

it('rejects a captured webhook replayed after the 5 minute window', function () {
    $booking = secBooking();
    $payment = secPendingPayment($booking, 'pi_real');
    $payload = secPaidPayload('pi_real', 50000);
    $timestamp = time() - 600;
    $signature = hash_hmac('sha256', $timestamp.'.'.json_encode($payload), 'whsec_fake');

    secWebhook($payload, "t={$timestamp},te={$signature},li=")->assertStatus(400);

    expect($payment->fresh()->status)->toBe(PaymentStatus::Pending);
});

it('rejects every webhook when no secret is configured', function () {
    $booking = secBooking();
    $payment = secPendingPayment($booking, 'pi_real');
    $payload = secPaidPayload('pi_real', 50000);
    $timestamp = time();
    $signature = hash_hmac('sha256', $timestamp.'.'.json_encode($payload), '');

    config(['services.paymongo.webhook_secret' => null]);

    secWebhook($payload, "t={$timestamp},te={$signature},li=")->assertStatus(400);

    expect($payment->fresh()->status)->toBe(PaymentStatus::Pending);
});

it('answers a malformed signature header with a 400, never a 500', function (string $header) {
    secWebhook(secPaidPayload('pi_x', 100), $header)->assertStatus(400);
})->with([
    'garbage' => 'not-a-signature',
    'timestamp only' => 't=12345',
    'li without te key' => 't='.time().',li=deadbeef',
    'te without li key' => 't='.time().',te=deadbeef',
    'empty values' => 't=,te=,li=',
]);

it('accepts a live-mode header that omits the te key entirely', function () {
    $booking = secBooking();
    $payment = secPendingPayment($booking, 'pi_live');
    $payload = secPaidPayload('pi_live', 50000);
    $timestamp = time();
    $signature = hash_hmac('sha256', $timestamp.'.'.json_encode($payload), 'whsec_fake');

    secWebhook($payload, "t={$timestamp},li={$signature}")->assertOk();

    expect($payment->fresh()->status)->toBe(PaymentStatus::Paid);
});

it('marks a booking paid from either PayMongo event type', function (string $type) {
    $booking = secBooking();
    $payment = secPendingPayment($booking, 'pi_ok');

    secWebhook(secPaidPayload('pi_ok', 50000, $type))->assertOk();

    expect($payment->fresh()->status)->toBe(PaymentStatus::Paid)
        ->and($booking->fresh()->payment_status)->toBe(PaymentStatus::Paid)
        ->and($booking->fresh()->status)->toBe(BookingStatus::Approved);
})->with(['payment_intent.succeeded', 'payment.paid']);

it('ignores event types that are not a successful payment', function () {
    $booking = secBooking();
    $payment = secPendingPayment($booking, 'pi_fail');

    secWebhook(['data' => ['attributes' => [
        'type' => 'payment.failed',
        'data' => ['id' => 'pay_x', 'attributes' => ['payment_intent_id' => 'pi_fail', 'amount' => 50000]],
    ]]])->assertOk();

    expect($payment->fresh()->status)->toBe(PaymentStatus::Pending);
});

it('acknowledges a webhook for an unknown payment without touching anything', function () {
    $booking = secBooking();
    $payment = secPendingPayment($booking, 'pi_mine');

    secWebhook(secPaidPayload('pi_someone_else', 50000))->assertOk();

    expect($payment->fresh()->status)->toBe(PaymentStatus::Pending);
});

it('processes a retried webhook only once', function () {
    Event::fake([PaymentSuccessful::class]);

    $booking = secBooking();
    $payment = secPendingPayment($booking, 'pi_retry');

    secWebhook(secPaidPayload('pi_retry', 50000))->assertOk();
    $paidAt = $payment->fresh()->paid_at;

    $this->travel(2)->minutes();

    secWebhook(secPaidPayload('pi_retry', 50000))->assertOk();
    secWebhook(secPaidPayload('pi_retry', 50000, 'payment.paid'))->assertOk();

    expect($payment->fresh()->paid_at->equalTo($paidAt))->toBeTrue()
        ->and($payment->fresh()->notes)->toBeNull();

    Event::assertDispatchedTimes(PaymentSuccessful::class, 1);
});

it('refuses to confirm a payment when PayMongo reports a different amount', function () {
    $booking = secBooking();
    $payment = secPendingPayment($booking, 'pi_short');

    secWebhook(secPaidPayload('pi_short', 100))->assertOk();

    expect($payment->fresh()->status)->toBe(PaymentStatus::Pending)
        ->and($payment->fresh()->notes)->toContain('Amount mismatch')
        ->and($booking->fresh()->payment_status)->toBe(PaymentStatus::Unpaid);
});

it('keeps a payment recorded when the live broadcast fails', function () {
    // Stands in for the websocket server being down: the broadcast is
    // synchronous, and before the fix its exception rolled the payment back.
    Event::listen(PaymentSuccessful::class, fn () => throw new RuntimeException('pusher down'));

    $booking = secBooking();
    $payment = secPendingPayment($booking, 'pi_ws');

    secWebhook(secPaidPayload('pi_ws', 50000))->assertOk();

    expect($payment->fresh()->status)->toBe(PaymentStatus::Paid)
        ->and($booking->fresh()->payment_status)->toBe(PaymentStatus::Paid);
});

// ---------------------------------------------------------------------------
// Late and duplicate payments: money in is never silently lost.
// ---------------------------------------------------------------------------

it('flags a second payment for the same booking for refund instead of double-counting it', function () {
    $booking = secBooking();
    $first = secPendingPayment($booking, 'pi_first');
    $second = secPendingPayment($booking, 'pi_second');

    secWebhook(secPaidPayload('pi_first', 50000))->assertOk();
    secWebhook(secPaidPayload('pi_second', 50000))->assertOk();

    expect($first->fresh()->notes)->toBeNull()
        ->and($second->fresh()->status)->toBe(PaymentStatus::Paid)
        ->and($second->fresh()->notes)->toContain('Refund required')
        ->and($booking->fresh()->payment_status)->toBe(PaymentStatus::Paid);
});

it('gives the booking back when it is paid after auto-cancel and the slot is still free', function () {
    $booking = secBooking(attributes: ['status' => BookingStatus::Cancelled, 'cancellation_reason' => 'Auto-cancelled']);
    $payment = secPendingPayment($booking, 'pi_late');

    secWebhook(secPaidPayload('pi_late', 50000))->assertOk();

    expect($booking->fresh()->status)->toBe(BookingStatus::Approved)
        ->and($booking->fresh()->payment_status)->toBe(PaymentStatus::Paid)
        ->and($booking->fresh()->cancellation_reason)->toBeNull()
        ->and($payment->fresh()->notes)->toBeNull();
});

it('flags a refund when a cancelled booking is paid after someone else took the slot', function () {
    $booking = secBooking(attributes: ['status' => BookingStatus::Cancelled]);
    $payment = secPendingPayment($booking, 'pi_late');

    ResourceBooking::factory()->create([
        'resource_id' => $booking->resource_id,
        'starts_at' => $booking->starts_at,
        'ends_at' => $booking->ends_at,
        'status' => BookingStatus::Approved,
        'payment_status' => PaymentStatus::Paid,
    ]);

    secWebhook(secPaidPayload('pi_late', 50000))->assertOk();

    expect($booking->fresh()->status)->toBe(BookingStatus::Cancelled)
        ->and($payment->fresh()->status)->toBe(PaymentStatus::Paid)
        ->and($payment->fresh()->notes)->toContain('Refund required');
});

it('does not auto-cancel a booking while its QR can still be paid, then cancels once it expires', function () {
    Setting::query()->updateOrCreate(['group' => 'bookings', 'key' => 'unpaid_cancel_minutes'], ['value' => 15]);

    $booking = secBooking(attributes: ['created_at' => now()->subMinutes(20), 'booking_group_id' => 'grp-1']);
    $sibling = secBooking($booking->user, ['created_at' => now()->subMinutes(20), 'booking_group_id' => 'grp-1']);
    secPendingPayment($booking, 'pi_scanning', ['qr_expires_at' => now()->addMinutes(5)]);

    $this->artisan('bookings:cancel-unpaid')->assertSuccessful();

    expect($booking->fresh()->status)->toBe(BookingStatus::Pending)
        ->and($sibling->fresh()->status)->toBe(BookingStatus::Pending);

    $this->travel(6)->minutes();
    $this->artisan('bookings:cancel-unpaid')->assertSuccessful();

    expect($booking->fresh()->status)->toBe(BookingStatus::Cancelled)
        ->and($sibling->fresh()->status)->toBe(BookingStatus::Cancelled);
});

it('stops holding a slot for a long-lived QR once the grace period is over', function () {
    Setting::query()->updateOrCreate(['group' => 'bookings', 'key' => 'unpaid_cancel_minutes'], ['value' => 60]);

    // PayMongo's QR is still valid for hours, but the hold is bounded.
    $booking = secBooking(attributes: ['created_at' => now()->subMinutes(76)]);
    secPendingPayment($booking, 'pi_long', ['qr_expires_at' => now()->addHours(3)]);

    $this->artisan('bookings:cancel-unpaid')->assertSuccessful();

    expect($booking->fresh()->status)->toBe(BookingStatus::Cancelled);
});

it('releases expired holds when the booking pages load, even if the scheduler is not running', function () {
    Setting::query()->updateOrCreate(['group' => 'bookings', 'key' => 'unpaid_cancel_minutes'], ['value' => 60]);
    $booking = secBooking(attributes: ['created_at' => now()->subMinutes(61)]);

    // The customer opens their booking after the window: it reads as cancelled,
    // not "0:00 left".
    $this->actingAs($booking->user)
        ->get(route('bookings.show', $booking))
        ->assertInertia(fn ($page) => $page->where('booking.status', 'cancelled'));

    // And someone else browsing slots sees it available again.
    $other = secBooking(attributes: ['created_at' => now()->subMinutes(61)]);
    Cache::forget('bookings:release-unpaid');

    $this->actingAs(secUser())->get(route('bookings.create'))->assertOk();

    expect($other->fresh()->status)->toBe(BookingStatus::Cancelled);
});

// ---------------------------------------------------------------------------
// Checkout: who can pay, what they're charged, and nothing hangs.
// ---------------------------------------------------------------------------

it('sends a guest to log in instead of showing or starting a checkout', function () {
    $booking = secBooking();

    $this->get(route('bookings.checkout', $booking))->assertRedirect(route('login'));
    $this->post(route('bookings.checkout.generate', $booking), ['payment_method' => 'qrph'])->assertRedirect(route('login'));

    expect(secIntentCalls())->toBe(0);
});

it('does not let one customer view or pay for another customer\'s booking', function () {
    $booking = secBooking();
    $stranger = secUser();

    $this->actingAs($stranger)->get(route('bookings.checkout', $booking))->assertForbidden();
    $this->actingAs($stranger)->post(route('bookings.checkout.generate', $booking), ['payment_method' => 'qrph'])->assertForbidden();

    expect(secIntentCalls())->toBe(0)
        ->and(Payment::query()->count())->toBe(0);
});

it('charges the server-side price and ignores any amount the browser sends', function () {
    $booking = secBooking();

    $this->actingAs($booking->user)
        ->post(route('bookings.checkout.generate', $booking), ['payment_method' => 'qrph', 'amount' => 1, 'total' => 1])
        ->assertOk();

    Http::assertSent(fn (HttpRequest $request) => str_ends_with($request->url(), '/v1/payment_intents')
        && $request['data']['attributes']['amount'] === 50000);

    expect((string) Payment::query()->sole()->amount)->toBe('500.00');
});

it('rejects payment methods that are not live', function (string $method) {
    $booking = secBooking();

    $this->actingAs($booking->user)
        ->post(route('bookings.checkout.generate', $booking), ['payment_method' => $method])
        ->assertSessionHasErrors('payment_method');

    expect(secIntentCalls())->toBe(0);
})->with(['gcash', 'maya', 'cash', '']);

it('hands back the same QR on a double-click instead of creating a second chargeable one', function () {
    $booking = secBooking();
    $this->actingAs($booking->user);

    $this->post(route('bookings.checkout.generate', $booking), ['payment_method' => 'qrph'])->assertOk();
    $this->post(route('bookings.checkout.generate', $booking), ['payment_method' => 'qrph'])->assertOk();

    expect(secIntentCalls())->toBe(1)
        ->and(Payment::query()->count())->toBe(1);
});

it('issues a fresh QR once the previous one has expired', function () {
    $booking = secBooking();
    $this->actingAs($booking->user);

    $this->post(route('bookings.checkout.generate', $booking), ['payment_method' => 'qrph'])->assertOk();
    $this->travel(16)->minutes();
    $this->post(route('bookings.checkout.generate', $booking), ['payment_method' => 'qrph'])->assertOk();

    expect(secIntentCalls())->toBe(2);
});

it('will not start a payment for a cancelled or rejected booking', function (BookingStatus $status) {
    $booking = secBooking(attributes: ['status' => $status]);

    $this->actingAs($booking->user)
        ->post(route('bookings.checkout.generate', $booking), ['payment_method' => 'qrph'])
        ->assertRedirect(route('bookings.checkout', $booking));

    expect(secIntentCalls())->toBe(0)
        ->and(Payment::query()->count())->toBe(0);
})->with([BookingStatus::Cancelled, BookingStatus::Rejected]);

it('will not start a payment once the payment window has closed', function () {
    Setting::query()->updateOrCreate(['group' => 'bookings', 'key' => 'unpaid_cancel_minutes'], ['value' => 15]);
    $booking = secBooking(attributes: ['created_at' => now()->subMinutes(16)]);

    $this->actingAs($booking->user)
        ->post(route('bookings.checkout.generate', $booking), ['payment_method' => 'qrph'])
        ->assertRedirect(route('bookings.checkout', $booking));

    expect(secIntentCalls())->toBe(0);
});

it('will not start a second payment for an already-paid booking', function () {
    $booking = secBooking(attributes: ['payment_status' => PaymentStatus::Paid, 'status' => BookingStatus::Approved]);

    $this->actingAs($booking->user)
        ->post(route('bookings.checkout.generate', $booking), ['payment_method' => 'qrph'])
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('qrPayment', null));

    expect(secIntentCalls())->toBe(0);
});

it('shows a friendly error and leaves nothing stuck when PayMongo is down', function (string $failure) {
    secGateway(match ($failure) {
        'server error' => ['api.paymongo.com/v1/payment_intents' => Http::response(['errors' => []], 500)],
        'no QR image' => ['api.paymongo.com/v1/payment_intents/*/attach' => Http::response(['data' => ['attributes' => ['next_action' => []]]])],
    });
    $booking = secBooking();

    $this->actingAs($booking->user)
        ->post(route('bookings.checkout.generate', $booking), ['payment_method' => 'qrph'])
        ->assertRedirect(route('bookings.checkout', $booking));

    expect(Payment::query()->sole()->status)->toBe(PaymentStatus::Failed);

    // The failed attempt must not come back as a "Preparing payment…" QR.
    $this->get(route('bookings.checkout', $booking))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('qrPayment', null));
})->with(['server error', 'no QR image']);

it('never sends gateway internals to the browser', function () {
    $booking = secBooking();
    $payment = secPendingPayment($booking, 'pi_secret', ['raw_response' => ['attributes' => ['client_key' => 'ck_secret']]]);

    expect($payment->fresh()->toArray())
        ->not->toHaveKey('raw_response')
        ->not->toHaveKey('paymongo_payment_intent_id')
        ->not->toHaveKey('paymongo_payment_method_id');
});

// ---------------------------------------------------------------------------
// Admin: marking a payment paid by hand.
// ---------------------------------------------------------------------------

it('marks the booking paid too when an admin marks its payment paid', function () {
    $booking = secBooking();
    $payment = secPendingPayment($booking, 'pi_desk');

    $this->actingAs(secUser(RoleEnum::ClubAdmin))
        ->patch(route('payments.mark-paid', $payment), ['payment_method' => 'cash'])
        ->assertRedirect(route('payments.show', $payment));

    expect($payment->fresh()->status)->toBe(PaymentStatus::Paid)
        ->and($booking->fresh()->payment_status)->toBe(PaymentStatus::Paid)
        ->and($booking->fresh()->status)->toBe(BookingStatus::Approved);
});

it('does not let a player mark a payment paid', function () {
    $booking = secBooking();
    $payment = secPendingPayment($booking, 'pi_desk');

    // The venue.admin middleware turns players away before the policy runs.
    $this->actingAs($booking->user)->patch(route('payments.mark-paid', $payment))->assertRedirect();

    expect($payment->fresh()->status)->toBe(PaymentStatus::Pending);
});

// ---------------------------------------------------------------------------
// Open Play.
// ---------------------------------------------------------------------------

/**
 * @return array{0: User, 1: OpenPlaySession, 2: OpenPlayRegistration}
 */
function secOpenPlayRegistration(array $sessionAttributes = []): array
{
    $user = secUser();
    $player = Player::factory()->for($user)->create(['birthdate' => '1990-01-01']);
    $session = OpenPlaySession::factory()->create([
        'team_size' => TeamSize::Singles,
        'price_per_player' => 150,
        'max_players' => 16,
        'starts_at' => now()->addDays(3),
        'ends_at' => now()->addDays(3)->addHours(2),
        ...$sessionAttributes,
    ]);

    $registration = OpenPlayRegistration::query()->create([
        'open_play_session_id' => $session->id,
        'player_id' => $player->id,
        'created_by' => $user->id,
        'payment_status' => PaymentStatus::Unpaid,
        'amount' => 150,
    ]);

    return [$user, $session, $registration];
}

it('will not take payment for an open play session that has already started', function () {
    [$user, $session] = secOpenPlayRegistration();
    $session->update(['starts_at' => now()->subMinute()]);

    $this->actingAs($user)
        ->post(route('open-play.checkout.generate', $session), ['payment_method' => 'qrph'])
        ->assertRedirect(route('open-play.checkout', $session));

    expect(secIntentCalls())->toBe(0);
});

it('will not take payment once paid players have filled the session', function () {
    [$user, $session] = secOpenPlayRegistration(['max_players' => 1]);

    OpenPlayRegistration::query()->create([
        'open_play_session_id' => $session->id,
        'player_id' => Player::factory()->create()->id,
        'created_by' => $user->id,
        'payment_status' => PaymentStatus::Paid,
        'amount' => 150,
    ]);

    $this->actingAs($user)
        ->post(route('open-play.checkout.generate', $session), ['payment_method' => 'qrph'])
        ->assertRedirect(route('open-play.checkout', $session));

    expect(secIntentCalls())->toBe(0);
});

it('only ever charges a member for their own open play registration', function () {
    [, $session] = secOpenPlayRegistration();
    $stranger = secUser();
    Player::factory()->for($stranger)->create();

    $this->actingAs($stranger)
        ->post(route('open-play.checkout.generate', $session), ['payment_method' => 'qrph'])
        ->assertRedirect(route('open-play.join', $session));

    expect(secIntentCalls())->toBe(0);
});

it('hands back the same open play QR on a double-click', function () {
    [$user, $session] = secOpenPlayRegistration();
    $this->actingAs($user);

    $this->post(route('open-play.checkout.generate', $session), ['payment_method' => 'qrph'])->assertOk();
    $this->post(route('open-play.checkout.generate', $session), ['payment_method' => 'qrph'])->assertOk();

    expect(secIntentCalls())->toBe(1);
});

it('runs the scheduled tasks after a page request when the server has no cron', function () {
    config(['app.schedule_on_request' => true]);
    Setting::query()->updateOrCreate(['group' => 'bookings', 'key' => 'unpaid_cancel_minutes'], ['value' => 60]);
    $overdue = secBooking(attributes: ['created_at' => now()->subMinutes(61)]);

    // Any page at all — here, the public home page by a guest.
    $this->get('/')->assertOk();

    expect($overdue->fresh()->status)->toBe(BookingStatus::Cancelled);

    // Throttled: a second overdue booking waits for the next minute's run.
    $next = secBooking(attributes: ['created_at' => now()->subMinutes(61)]);
    Cache::forget('bookings:release-unpaid');
    $this->get(route('login'));
    expect($next->fresh()->status)->toBe(BookingStatus::Pending);

    $this->travel(61)->seconds();
    $this->get(route('login'));
    expect($next->fresh()->status)->toBe(BookingStatus::Cancelled);
});
