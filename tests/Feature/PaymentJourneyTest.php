<?php

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
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
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\Client\Factory as HttpFactory;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\URL;
use Illuminate\Testing\TestResponse;
use Spatie\Permission\Models\Role;

/**
 * End-to-end customer and staff journeys through real routes, controllers,
 * policies, database writes and the scheduled auto-cancel job. Only the two
 * things that need a real PayMongo account are simulated: its API (faked
 * HTTP) and its signed webhook. Each journey is the whole story a real person
 * would live through, start to finish.
 */
function journeyGateway(bool $down = false): void
{
    config([
        'services.paymongo.secret_key' => 'sk_test_fake',
        'services.paymongo.webhook_secret' => 'whsec_fake',
        'services.paymongo.fee_percent' => 0,
        'services.paymongo.fee_fixed' => 0,
    ]);

    Http::swap(new HttpFactory);

    if ($down) {
        Http::fake(['api.paymongo.com/*' => Http::response(['errors' => [['detail' => 'Service unavailable']]], 503)]);

        return;
    }

    $sequence = 0;

    Http::fake([
        'api.paymongo.com/v1/payment_intents/*/attach' => fn () => Http::response([
            'data' => ['attributes' => ['next_action' => ['code' => [
                'image_url' => 'https://api.paymongo.com/qr/journey.png',
                'expires_at' => now()->addMinutes(15)->toIso8601String(),
            ]]]],
        ]),
        'api.paymongo.com/v1/payment_intents' => function () use (&$sequence) {
            $sequence++;

            return Http::response(['data' => ['id' => "pi_journey_{$sequence}", 'attributes' => ['client_key' => "ck_{$sequence}"]]]);
        },
        'api.paymongo.com/v1/payment_methods' => Http::response(['data' => ['id' => 'pm_journey']]),
    ]);
}

/**
 * PayMongo telling us a QR was paid, signed exactly as PayMongo signs it.
 */
function journeyPayMongoConfirms(Payment $payment, ?int $centavos = null): TestResponse
{
    $payload = ['data' => ['attributes' => [
        'type' => 'payment.paid',
        'data' => ['id' => 'pay_'.$payment->id, 'attributes' => [
            'amount' => $centavos ?? (int) round((float) $payment->amount * 100),
            'payment_intent_id' => $payment->paymongo_payment_intent_id,
        ]],
    ]]];

    $body = json_encode($payload);
    $timestamp = time();
    $signature = hash_hmac('sha256', $timestamp.'.'.$body, 'whsec_fake');

    // Webhooks arrive with no session or cookies.
    auth()->forgetGuards();

    return test()->call('POST', '/webhooks/paymongo', [], [], [], [
        'CONTENT_TYPE' => 'application/json',
        'HTTP_PAYMONGO_SIGNATURE' => "t={$timestamp},te=,li={$signature}",
    ], $body);
}

function journeyCourt(): Resource
{
    DateOverride::query()->firstOrCreate(
        ['date' => now()->addDay()->toDateString()],
        ['is_closed' => false, 'open_time' => '08:00', 'close_time' => '22:00'],
    );

    return Resource::factory()->create([
        'name' => 'Court 1',
        'sport' => Sport::Pickleball,
        'status' => ResourceStatus::Available,
        'hourly_rate' => 500,
    ]);
}

function journeyMember(string $email): User
{
    Role::findOrCreate(RoleEnum::Player->value, 'web');

    $user = User::factory()->create(['email' => $email, 'email_verified_at' => now()]);
    $user->assignRole(RoleEnum::Player->value);

    return $user;
}

function journeyAdmin(): User
{
    Role::findOrCreate(RoleEnum::ClubAdmin->value, 'web');

    $admin = User::factory()->create(['email_verified_at' => now()]);
    $admin->assignRole(RoleEnum::ClubAdmin->value);

    return $admin;
}

/**
 * @return array<string, string>
 */
function journeySlot(int $hour = 10, int $hours = 1): array
{
    $start = now()->addDay()->setTime($hour, 0);

    return [
        'starts_at' => $start->toDateTimeString(),
        'ends_at' => $start->clone()->addHours($hours)->toDateTimeString(),
    ];
}

function journeyLatestPayment(): Payment
{
    return Payment::query()->latest('id')->firstOrFail();
}

it('takes a brand-new visitor from sign-up to a confirmed, paid court booking', function () {
    journeyGateway();
    Role::findOrCreate(RoleEnum::Player->value, 'web');
    $court = journeyCourt();

    // Signs up.
    $this->post(route('register.store'), [
        'name' => 'Ana Reyes',
        'email' => 'ana@example.com',
        'password' => 'Str0ng-Passw0rd!',
        'password_confirmation' => 'Str0ng-Passw0rd!',
    ])->assertRedirect();

    $ana = User::query()->where('email', 'ana@example.com')->sole();
    $this->assertAuthenticatedAs($ana);

    // An unverified account can't book yet.
    $this->get(route('bookings.create'))->assertRedirect(route('verification.notice'));

    // Clicks the link in the verification email.
    $this->get(URL::temporarySignedRoute('verification.verify', now()->addHour(), [
        'id' => $ana->id,
        'hash' => sha1($ana->email),
    ]))->assertRedirect();
    expect($ana->fresh()->hasVerifiedEmail())->toBeTrue();
    $ana = $ana->fresh();
    $ana->assignRole(RoleEnum::Player->value);

    // Books 10am–12pm and lands on checkout.
    $this->post(route('bookings.store-bulk'), ['bookings' => [['resource_id' => $court->id, ...journeySlot(10, 2)]]])
        ->assertRedirect();
    $booking = ResourceBooking::query()->where('user_id', $ana->id)->sole();
    expect((float) $booking->amount)->toBe(1000.0)
        ->and($booking->payment_status)->toBe(PaymentStatus::Unpaid);

    $this->get(route('bookings.checkout', $booking))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('qrPayment', null)->where('fee.total', 1000));

    // Generates a QR, then refreshes the page — same QR, not a new charge.
    $this->post(route('bookings.checkout.generate', $booking), ['payment_method' => 'qrph'])
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('qrPayment.qrCodeUrl', 'https://api.paymongo.com/qr/journey.png'));
    $payment = journeyLatestPayment();

    $this->get(route('bookings.checkout', $booking))
        ->assertInertia(fn ($page) => $page->where('qrPayment.id', $payment->id));

    // Scans and pays in GCash; PayMongo confirms.
    journeyPayMongoConfirms($payment)->assertOk();

    // Back in the browser: confirmation, booking page, and bookings list agree.
    $this->actingAs($ana);
    $this->get(route('bookings.checkout', $booking))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('booking.payment_status', 'paid')->where('booking.status', 'approved'));
    $this->get(route('bookings.show', $booking))->assertOk();
    $this->get(route('bookings.index'))->assertOk();

    // The front desk sees exactly one paid payment for the right amount.
    $this->actingAs(journeyAdmin())
        ->get(route('payments.index', ['status' => 'paid']))
        ->assertInertia(fn ($page) => $page
            ->has('payments.data', 1)
            ->where('payments.data.0.amount', '1000.00')
            ->where('payments.data.0.flagged_at', null)
            ->missing('payments.data.0.raw_response'));

    // And nobody else can now book Ana's slot.
    $this->actingAs(journeyMember('ben@example.com'))
        ->post(route('bookings.store-bulk'), ['bookings' => [['resource_id' => $court->id, ...journeySlot(11)]]])
        ->assertSessionHasErrors('starts_at');
});

it('recovers cleanly when PayMongo is down, then lets the customer pay once it is back', function () {
    $court = journeyCourt();
    $ana = journeyMember('ana@example.com');
    $this->actingAs($ana);

    $this->post(route('bookings.store-bulk'), ['bookings' => [['resource_id' => $court->id, ...journeySlot()]]]);
    $booking = ResourceBooking::query()->sole();

    // PayMongo outage: a friendly message, no stuck "Preparing payment…".
    journeyGateway(down: true);
    $this->post(route('bookings.checkout.generate', $booking), ['payment_method' => 'qrph'])
        ->assertRedirect(route('bookings.checkout', $booking));
    $this->get(route('bookings.checkout', $booking))
        ->assertInertia(fn ($page) => $page->where('qrPayment', null)->hasFlash('toast.type', 'error'));

    // PayMongo recovers; she tries again and pays.
    journeyGateway();
    $this->post(route('bookings.checkout.generate', $booking), ['payment_method' => 'qrph'])->assertOk();
    $payment = Payment::query()->where('status', PaymentStatus::Pending)->sole();
    journeyPayMongoConfirms($payment)->assertOk();

    expect($booking->fresh()->payment_status)->toBe(PaymentStatus::Paid)
        ->and(Payment::query()->where('status', PaymentStatus::Failed)->count())->toBe(1)
        ->and(Payment::query()->where('status', PaymentStatus::Paid)->count())->toBe(1);
});

it('handles a payment that lands after the slot was released and resold, through to staff recording the refund', function () {
    journeyGateway();
    Setting::query()->updateOrCreate(['group' => 'bookings', 'key' => 'unpaid_cancel_minutes'], ['value' => 15]);
    $court = journeyCourt();
    $ana = journeyMember('ana@example.com');
    $ben = journeyMember('ben@example.com');

    // Ana books and opens the QR, then gets distracted.
    $this->actingAs($ana)->post(route('bookings.store-bulk'), ['bookings' => [['resource_id' => $court->id, ...journeySlot()]]]);
    $booking = ResourceBooking::query()->sole();
    $this->post(route('bookings.checkout.generate', $booking), ['payment_method' => 'qrph'])->assertOk();
    $payment = journeyLatestPayment();

    // Her window passes, but the QR is still live — the slot is held.
    $this->travel(14)->minutes();
    $this->artisan('bookings:cancel-unpaid');
    expect($booking->fresh()->status)->toBe(BookingStatus::Pending);

    // The QR expires; the slot is released and Ben books it.
    $this->travel(2)->minutes();
    $this->artisan('bookings:cancel-unpaid');
    expect($booking->fresh()->status)->toBe(BookingStatus::Cancelled);

    // Ana can't start a fresh payment for the cancelled booking.
    $this->actingAs($ana)->post(route('bookings.checkout.generate', $booking), ['payment_method' => 'qrph'])
        ->assertRedirect(route('bookings.checkout', $booking));

    $this->actingAs($ben)->post(route('bookings.store-bulk'), ['bookings' => [['resource_id' => $court->id, ...journeySlot()]]])
        ->assertSessionHasNoErrors();

    // Her bank was slow: PayMongo reports her payment only now.
    journeyPayMongoConfirms($payment)->assertOk();

    // Ben keeps his slot; Ana's money is recorded and flagged, not lost.
    expect($booking->fresh()->status)->toBe(BookingStatus::Cancelled)
        ->and($payment->fresh()->status)->toBe(PaymentStatus::Paid)
        ->and($payment->fresh()->flagged_at)->not->toBeNull();

    // Staff spot it on the payments page and record the refund.
    $admin = journeyAdmin();
    $this->actingAs($admin)
        ->get(route('payments.index'))
        ->assertInertia(fn ($page) => $page->where('flaggedCount', 1));
    $this->get(route('payments.index', ['status' => 'flagged']))
        ->assertInertia(fn ($page) => $page->has('payments.data', 1)->where('payments.data.0.id', $payment->id));
    $this->get(route('payments.show', $payment))
        ->assertInertia(fn ($page) => $page->where('canMarkRefunded', true));

    $this->patch(route('payments.mark-refunded', $payment), ['notes' => 'PayMongo refund ref_123'])
        ->assertRedirect(route('payments.show', $payment));

    expect($payment->fresh()->status)->toBe(PaymentStatus::Refunded)
        ->and($payment->fresh()->flagged_at)->toBeNull()
        ->and($payment->fresh()->notes)->toContain('ref_123');

    $this->get(route('payments.index'))->assertInertia(fn ($page) => $page->where('flaggedCount', 0));

    // It can't be "refunded" twice or marked paid again.
    $this->patch(route('payments.mark-refunded', $payment))->assertForbidden();
    $this->patch(route('payments.mark-paid', $payment));
    expect($payment->fresh()->status)->toBe(PaymentStatus::Refunded);
});

it('flags the second of two paid QRs for refund and keeps the booking paid once', function () {
    journeyGateway();
    $court = journeyCourt();
    $ana = journeyMember('ana@example.com');
    $this->actingAs($ana)->post(route('bookings.store-bulk'), ['bookings' => [['resource_id' => $court->id, ...journeySlot()]]]);
    $booking = ResourceBooking::query()->sole();

    // First QR expires on her screen; she generates another. Both get paid
    // (her phone had queued the first scan).
    $this->post(route('bookings.checkout.generate', $booking), ['payment_method' => 'qrph']);
    $first = journeyLatestPayment();
    $this->travel(16)->minutes();
    $this->post(route('bookings.checkout.generate', $booking), ['payment_method' => 'qrph']);
    $second = journeyLatestPayment();
    expect($second->id)->not->toBe($first->id);

    journeyPayMongoConfirms($second)->assertOk();
    journeyPayMongoConfirms($first)->assertOk();

    expect($booking->fresh()->payment_status)->toBe(PaymentStatus::Paid)
        ->and($second->fresh()->flagged_at)->toBeNull()
        ->and($first->fresh()->flagged_at)->not->toBeNull()
        ->and($first->fresh()->notes)->toContain('Duplicate payment');

    // Staff can refund only the flagged duplicate, never the good one.
    $this->actingAs(journeyAdmin());
    $this->patch(route('payments.mark-refunded', $second))->assertForbidden();
    $this->patch(route('payments.mark-refunded', $first))->assertRedirect();
});

it('takes a player through paying for themselves and two friends at open play', function () {
    journeyGateway();
    $ana = journeyMember('ana@example.com');
    Player::factory()->for($ana)->create(['birthdate' => '1995-05-05']);
    $friends = Player::factory()->count(2)->create();
    $session = OpenPlaySession::factory()->create([
        'team_size' => TeamSize::Singles,
        'price_per_player' => 150,
        'max_players' => 4,
        'starts_at' => now()->addDays(2),
        'ends_at' => now()->addDays(2)->addHours(2),
    ]);

    $this->actingAs($ana)
        ->post(route('open-play.join.store', $session), ['friend_player_ids' => $friends->pluck('id')->all()])
        ->assertRedirect(route('open-play.checkout', $session));

    $this->post(route('open-play.checkout.generate', $session), ['payment_method' => 'qrph'])->assertOk();
    $payment = journeyLatestPayment();
    expect((string) $payment->amount)->toBe('450.00');

    // Underpaying is refused outright.
    journeyPayMongoConfirms($payment, 100)->assertOk();
    expect($payment->fresh()->status)->toBe(PaymentStatus::Pending);

    journeyPayMongoConfirms($payment)->assertOk();

    expect($session->registrations()->where('payment_status', PaymentStatus::Paid)->count())->toBe(3)
        ->and($session->registeredPlayersCount())->toBe(3);

    $this->actingAs($ana)->get(route('open-play.mine', $session))->assertOk();

    // A latecomer whose party no longer fits can't pay their way in.
    $late = journeyMember('late@example.com');
    Player::factory()->for($late)->create(['birthdate' => '1990-01-01']);
    $this->actingAs($late)
        ->post(route('open-play.join.store', $session), ['friend_player_ids' => [Player::factory()->create()->id]]);
    $this->post(route('open-play.checkout.generate', $session), ['payment_method' => 'qrph']);

    expect(Payment::query()->count())->toBe(1);
});

it('stops a logged-in stranger at every step of someone else\'s payment', function () {
    journeyGateway();
    $court = journeyCourt();
    $ana = journeyMember('ana@example.com');
    $mallory = journeyMember('mallory@example.com');

    $this->actingAs($ana)->post(route('bookings.store-bulk'), ['bookings' => [['resource_id' => $court->id, ...journeySlot()]]]);
    $booking = ResourceBooking::query()->sole();
    $this->post(route('bookings.checkout.generate', $booking), ['payment_method' => 'qrph']);
    $payment = journeyLatestPayment();

    $this->actingAs($mallory);
    $this->get(route('bookings.show', $booking))->assertForbidden();
    $this->get(route('bookings.checkout', $booking))->assertForbidden();
    $this->post(route('bookings.checkout.generate', $booking), ['payment_method' => 'qrph'])->assertForbidden();
    $this->patch(route('bookings.mark-paid', $booking))->assertRedirect();
    $this->get(route('payments.index'))->assertRedirect();
    $this->get(route('payments.show', $payment))->assertRedirect();
    $this->patch(route('payments.mark-paid', $payment))->assertRedirect();
    $this->get(route('bookings.index'))->assertInertia(fn ($page) => $page->where('bookings.total', 0));

    // Forging PayMongo's webhook without the secret.
    $forged = json_encode(['data' => ['attributes' => [
        'type' => 'payment.paid',
        'data' => ['attributes' => ['payment_intent_id' => $payment->paymongo_payment_intent_id, 'amount' => 50000]],
    ]]]);
    $this->call('POST', '/webhooks/paymongo', [], [], [], [
        'CONTENT_TYPE' => 'application/json',
        'HTTP_PAYMONGO_SIGNATURE' => 't='.time().',te='.hash_hmac('sha256', time().'.'.$forged, 'guess').',li=',
    ], $forged)->assertStatus(400);

    expect($booking->fresh()->payment_status)->toBe(PaymentStatus::Unpaid)
        ->and($payment->fresh()->status)->toBe(PaymentStatus::Pending)
        ->and(Payment::query()->count())->toBe(1);
});
