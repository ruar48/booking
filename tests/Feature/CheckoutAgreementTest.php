<?php

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Enums\PolicyPlacement;
use App\Enums\ResourceStatus;
use App\Enums\Role as RoleEnum;
use App\Enums\Sport;
use App\Enums\TeamSize;
use App\Models\DateOverride;
use App\Models\OpenPlaySession;
use App\Models\Payment;
use App\Models\Player;
use App\Models\Policy;
use App\Models\Resource;
use App\Models\ResourceBooking;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Spatie\Permission\Models\Role;

/**
 * The "I agree" box at online checkout. No payment starts without it, and the
 * payment keeps a record of exactly what was agreed to, when and from where:
 * the proof to point to if a customer later disputes the policy.
 */
beforeEach(function () {
    config([
        'services.paymongo.secret_key' => 'sk_test_fake',
        'services.paymongo.fee_percent' => 0,
        'services.paymongo.fee_fixed' => 0,
        'legal.terms.version' => '2026-11-05',
        'legal.privacy.version' => '2026-11-04',
    ]);

    Http::fake([
        'api.paymongo.com/v1/payment_intents' => Http::response(['data' => ['id' => 'pi_agree', 'attributes' => ['client_key' => 'ck']]]),
        'api.paymongo.com/v1/payment_methods' => Http::response(['data' => ['id' => 'pm_agree']]),
        'api.paymongo.com/v1/payment_intents/*/attach' => Http::response([
            'data' => ['attributes' => ['next_action' => ['code' => [
                'image_url' => 'https://api.paymongo.com/qr/agree.png',
                'expires_at' => now()->addMinutes(15)->toIso8601String(),
            ]]]],
        ]),
    ]);
});

function agreementCustomer(): User
{
    Role::findOrCreate(RoleEnum::Player->value, 'web');

    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole(RoleEnum::Player->value);

    return $user;
}

function agreementBooking(User $owner): ResourceBooking
{
    $startsAt = now()->addDay()->setTime(10, 0);

    DateOverride::query()->firstOrCreate(
        ['date' => $startsAt->toDateString()],
        ['is_closed' => false, 'open_time' => '08:00', 'close_time' => '22:00'],
    );

    return ResourceBooking::factory()->create([
        'resource_id' => Resource::factory()->create(['sport' => Sport::Pickleball, 'status' => ResourceStatus::Available])->id,
        'user_id' => $owner->id,
        'starts_at' => $startsAt,
        'ends_at' => $startsAt->clone()->addHour(),
        'status' => BookingStatus::Pending,
        'payment_status' => PaymentStatus::Unpaid,
        'amount' => 500,
    ]);
}

it('won\'t start a payment until the customer ticks the box', function () {
    $ana = agreementCustomer();
    $booking = agreementBooking($ana);

    $this->actingAs($ana)
        ->post(route('bookings.checkout.generate', $booking), [
            'payment_method' => 'qrph',
            'policy_versions' => checkoutAgreement()['policy_versions'],
        ])
        ->assertSessionHasErrors(['agreed' => 'Please agree to the payment policy and the Terms of Service to continue.']);

    expect(Payment::query()->count())->toBe(0);
    Http::assertNothingSent();
});

it('asks again when the policy was changed after the page was opened', function () {
    $ana = agreementCustomer();
    $booking = agreementBooking($ana);
    $seenOnThePage = checkoutAgreement();

    // The owner edits the refund policy while Ana is still on checkout.
    $policy = Policy::activeAt(PolicyPlacement::Checkout)->firstOrFail();
    $policy->update(['body' => 'Refunds within 24 hours only.']);

    $this->actingAs($ana)
        ->post(route('bookings.checkout.generate', $booking), ['payment_method' => 'qrph', ...$seenOnThePage])
        ->assertSessionHasErrors(['agreed' => 'Our payment policy was just updated. Please read it and agree again.']);

    expect(Payment::query()->count())->toBe(0);

    // Agreeing to the current wording goes through.
    $this->post(route('bookings.checkout.generate', $booking), ['payment_method' => 'qrph', ...checkoutAgreement()])
        ->assertOk();

    // Recorded against the edited wording, not the one first shown.
    expect(Payment::query()->sole()->agreement['policies'][0]['version'])
        ->toBe($policy->fresh()->version)
        ->toBeGreaterThan($seenOnThePage['policy_versions'][$policy->id]);
});

it('keeps what was agreed to, when, and from where with the payment', function () {
    $ana = agreementCustomer();
    $booking = agreementBooking($ana);
    $policy = Policy::activeAt(PolicyPlacement::Checkout)->firstOrFail();

    $this->actingAs($ana)
        ->withHeader('User-Agent', 'AgreementTest/1.0')
        ->post(route('bookings.checkout.generate', $booking), ['payment_method' => 'qrph', ...checkoutAgreement()])
        ->assertOk();

    $payment = Payment::query()->sole();

    expect($payment->agreed_at)->not->toBeNull()
        ->and($payment->agreement)->toBe([
            'terms_version' => '2026-11-05',
            'privacy_version' => '2026-11-04',
            'policies' => [['id' => $policy->id, 'title' => $policy->title, 'version' => $policy->version]],
            'ip' => '127.0.0.1',
            'user_agent' => 'AgreementTest/1.0',
        ]);
});

it('still asks for agreement to the Terms when no payment policy is published', function () {
    Policy::query()->update(['is_active' => false]);
    $ana = agreementCustomer();
    $booking = agreementBooking($ana);

    $this->actingAs($ana)
        ->post(route('bookings.checkout.generate', $booking), ['payment_method' => 'qrph', 'policy_versions' => []])
        ->assertSessionHasErrors('agreed');

    $this->post(route('bookings.checkout.generate', $booking), ['payment_method' => 'qrph', ...checkoutAgreement()])
        ->assertOk();

    expect(Payment::query()->sole()->agreement)
        ->policies->toBe([])
        ->terms_version->toBe('2026-11-05');
});

it('records the agreement for an Open Play payment too', function () {
    $ana = agreementCustomer();
    Player::factory()->for($ana)->create();
    $session = OpenPlaySession::factory()->create([
        'team_size' => TeamSize::Singles,
        'price_per_player' => 150,
        'max_players' => 16,
        'starts_at' => now()->addDays(3),
        'ends_at' => now()->addDays(3)->addHours(2),
    ]);

    $this->actingAs($ana)->post(route('open-play.join.store', $session))->assertRedirect(route('open-play.checkout', $session));

    $this->post(route('open-play.checkout.generate', $session), ['payment_method' => 'qrph'])
        ->assertSessionHasErrors('agreed');

    $this->post(route('open-play.checkout.generate', $session), ['payment_method' => 'qrph', ...checkoutAgreement()])
        ->assertOk();

    expect(Payment::query()->sole())
        ->agreed_at->not->toBeNull()
        ->agreement->toHaveKey('terms_version', '2026-11-05');
});

it('shows the agreement on the payment\'s page, and keeps it out of everything else', function () {
    $ana = agreementCustomer();
    $booking = agreementBooking($ana);

    $this->actingAs($ana)
        ->post(route('bookings.checkout.generate', $booking), ['payment_method' => 'qrph', ...checkoutAgreement()])
        ->assertOk();

    $payment = Payment::query()->sole();

    Role::findOrCreate(RoleEnum::SuperAdmin->value, 'web');
    $owner = User::factory()->create(['email_verified_at' => now()]);
    $owner->assignRole(RoleEnum::SuperAdmin->value);

    $this->actingAs($owner)
        ->get(route('payments.show', $payment))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('payment.agreement.ip', '127.0.0.1')
            ->has('payment.agreement.policies', 1));

    // Anywhere else a payment is serialised, the IP and browser stay out.
    expect($payment->toArray())->not->toHaveKey('agreement');
});
