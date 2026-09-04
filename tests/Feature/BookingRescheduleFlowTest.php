<?php

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Enums\Role;
use App\Http\Middleware\HandleInertiaRequests;
use App\Models\DateOverride;
use App\Models\Resource;
use App\Models\ResourceBooking;
use App\Models\User;
use Carbon\CarbonInterface;
use Inertia\Testing\AssertableInertia;

/**
 * End-to-end coverage of the reschedule flow: opening the picker, submitting a
 * new slot, and landing on the replacement booking's detail page. The last leg
 * is the one that regressed in the browser — the PATCH succeeded and flashed
 * "Booking rescheduled." but the page it redirected to answered 403.
 */
function rescheduleOpenDate(string $date): DateOverride
{
    return DateOverride::query()->updateOrCreate(
        ['date' => $date],
        ['is_closed' => false, 'open_time' => '06:00', 'close_time' => '22:00'],
    );
}

/**
 * Inertia rejects a GET without a matching asset version with a 409, so the
 * version has to travel with the header for these to exercise the real path.
 *
 * @return array<string, string>
 */
function inertiaHeaders(): array
{
    return [
        'X-Inertia' => 'true',
        'X-Inertia-Version' => (string) app(HandleInertiaRequests::class)->version(request()),
    ];
}

function reschedulePlayer(): User
{
    $user = User::factory()->create();
    $user->assignRole(Role::Player->value);

    return $user;
}

function rescheduleClubAdmin(): User
{
    $user = User::factory()->create();
    $user->assignRole(Role::ClubAdmin->value);

    return $user;
}

function rescheduleBookingFor(User $owner, Resource $court, CarbonInterface $startsAt, array $overrides = []): ResourceBooking
{
    return ResourceBooking::factory()->create([
        'user_id' => $owner->id,
        'resource_id' => $court->id,
        'starts_at' => $startsAt,
        'ends_at' => $startsAt->clone()->addHour(),
        'status' => BookingStatus::Approved,
        'payment_status' => PaymentStatus::Unpaid,
        ...$overrides,
    ]);
}

beforeEach(function () {
    $this->court = Resource::factory()->create(['hourly_rate' => 250]);

    // Far enough out to clear the members' 2-day cutoff.
    $this->from = now()->addDays(6)->setTime(9, 0);
    $this->to = now()->addDays(7)->setTime(14, 0);

    rescheduleOpenDate($this->from->toDateString());
    rescheduleOpenDate($this->to->toDateString());
});

it('walks a member through the whole reschedule flow and lands on the new booking', function () {
    $member = reschedulePlayer();
    $booking = rescheduleBookingFor($member, $this->court, $this->from);

    // 1. The detail page offers the action.
    $this->actingAs($member)
        ->get(route('bookings.show', $booking))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->where('canReschedule', true));

    // 2. The picker opens.
    $this->actingAs($member)
        ->get(route('bookings.reschedule.edit', $booking))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->component('bookings/reschedule'));

    // 3. The new slot is accepted.
    $response = $this->actingAs($member)->patch(route('bookings.reschedule', $booking), [
        'resource_id' => $this->court->id,
        'starts_at' => $this->to->toDateTimeString(),
        'ends_at' => $this->to->clone()->addHour()->toDateTimeString(),
    ]);

    $replacement = ResourceBooking::query()->where('rescheduled_from_id', $booking->id)->sole();

    $response->assertRedirect(route('bookings.show', $replacement));

    expect($booking->fresh()->status)->toBe(BookingStatus::Cancelled)
        ->and($replacement->user_id)->toBe($member->id)
        ->and($replacement->status)->toBe(BookingStatus::Approved)
        ->and($replacement->starts_at->toDateTimeString())->toBe($this->to->toDateTimeString())
        ->and((float) $replacement->amount)->toBe(250.0);

    // 4. Following that redirect must render the booking, not 403.
    $this->actingAs($member)
        ->get(route('bookings.show', $replacement))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('bookings/show')
            ->where('booking.id', $replacement->id)
            ->where('canReschedule', false));
});

it('does not let a member reschedule the replacement a second time', function () {
    $member = reschedulePlayer();
    $booking = rescheduleBookingFor($member, $this->court, $this->from);

    $this->actingAs($member)->patch(route('bookings.reschedule', $booking), [
        'resource_id' => $this->court->id,
        'starts_at' => $this->to->toDateTimeString(),
        'ends_at' => $this->to->clone()->addHour()->toDateTimeString(),
    ]);

    $replacement = ResourceBooking::query()->where('rescheduled_from_id', $booking->id)->sole();

    $this->actingAs($member)
        ->get(route('bookings.reschedule.edit', $replacement))
        ->assertForbidden();
});

it('blocks a member inside the 2-day cutoff', function () {
    $member = reschedulePlayer();
    $soon = now()->addDay()->setTime(9, 0);
    rescheduleOpenDate($soon->toDateString());

    $booking = rescheduleBookingFor($member, $this->court, $soon);

    $this->actingAs($member)
        ->get(route('bookings.reschedule.edit', $booking))
        ->assertForbidden();
});

it('blocks a member from rescheduling a booking they do not own', function () {
    $booking = rescheduleBookingFor(reschedulePlayer(), $this->court, $this->from);

    $this->actingAs(reschedulePlayer())
        ->get(route('bookings.reschedule.edit', $booking))
        ->assertForbidden();
});

it('blocks rescheduling a cancelled booking, admins included', function () {
    $booking = rescheduleBookingFor(reschedulePlayer(), $this->court, $this->from, [
        'status' => BookingStatus::Cancelled,
    ]);

    $this->actingAs(rescheduleClubAdmin())
        ->get(route('bookings.reschedule.edit', $booking))
        ->assertForbidden();
});

it('lets a club admin reschedule inside the cutoff and more than once', function () {
    $admin = rescheduleClubAdmin();
    $soon = now()->addDay()->setTime(9, 0);
    rescheduleOpenDate($soon->toDateString());

    $booking = rescheduleBookingFor(reschedulePlayer(), $this->court, $soon);

    $this->actingAs($admin)->patch(route('bookings.reschedule', $booking), [
        'resource_id' => $this->court->id,
        'starts_at' => $this->to->toDateTimeString(),
        'ends_at' => $this->to->clone()->addHour()->toDateTimeString(),
    ])->assertSessionHasNoErrors();

    $replacement = ResourceBooking::query()->where('rescheduled_from_id', $booking->id)->sole();

    $this->actingAs($admin)
        ->get(route('bookings.reschedule.edit', $replacement))
        ->assertOk();
});

it('rejects a slot another booking already holds', function () {
    $member = reschedulePlayer();
    $booking = rescheduleBookingFor($member, $this->court, $this->from);
    rescheduleBookingFor(reschedulePlayer(), $this->court, $this->to);

    $this->actingAs($member)->patch(route('bookings.reschedule', $booking), [
        'resource_id' => $this->court->id,
        'starts_at' => $this->to->toDateTimeString(),
        'ends_at' => $this->to->clone()->addHour()->toDateTimeString(),
    ])->assertSessionHasErrors();

    expect($booking->fresh()->status)->toBe(BookingStatus::Approved)
        ->and(ResourceBooking::query()->where('rescheduled_from_id', $booking->id)->exists())->toBeFalse();
});

it('rejects a slot on a date the venue has not opened', function () {
    $member = reschedulePlayer();
    $booking = rescheduleBookingFor($member, $this->court, $this->from);
    $closed = now()->addDays(9)->setTime(10, 0);

    $this->actingAs($member)->patch(route('bookings.reschedule', $booking), [
        'resource_id' => $this->court->id,
        'starts_at' => $closed->toDateTimeString(),
        'ends_at' => $closed->clone()->addHour()->toDateTimeString(),
    ])->assertSessionHasErrors();

    expect($booking->fresh()->status)->toBe(BookingStatus::Approved);
});

/**
 * Reproduces the 403 seen in the browser. Every entry point to the picker is
 * gated on the policy, but those flags are baked into props: an Inertia page
 * restored from history cache (back button, a second tab) still renders a
 * "Reschedule" button for a booking that has since been moved. Submitting from
 * that stale page hits a booking the policy now refuses.
 */
it('answers 403 when a stale page submits against an already-rescheduled booking', function () {
    $member = reschedulePlayer();
    $booking = rescheduleBookingFor($member, $this->court, $this->from);

    $payload = [
        'resource_id' => $this->court->id,
        'starts_at' => $this->to->toDateTimeString(),
        'ends_at' => $this->to->clone()->addHour()->toDateTimeString(),
    ];

    $this->actingAs($member)
        ->patch(route('bookings.reschedule', $booking), $payload)
        ->assertSessionHasNoErrors();

    // The original is cancelled now, so the same submit replayed is refused.
    $this->actingAs($member)
        ->patch(route('bookings.reschedule', $booking), $payload)
        ->assertForbidden();

    $this->actingAs($member)
        ->get(route('bookings.reschedule.edit', $booking))
        ->assertForbidden();

    expect(ResourceBooking::query()->where('rescheduled_from_id', $booking->id)->count())->toBe(1);
});

/**
 * The browser half of the same case. Inertia can't render a 403 HTML page, so
 * a refused reschedule used to land the customer in a raw error overlay with
 * no way out. Now it bounces back with the policy's reason as a toast.
 */
it('bounces an Inertia visitor back with the reason instead of a raw 403', function () {
    $member = reschedulePlayer();
    $booking = rescheduleBookingFor($member, $this->court, $this->from);

    $payload = [
        'resource_id' => $this->court->id,
        'starts_at' => $this->to->toDateTimeString(),
        'ends_at' => $this->to->clone()->addHour()->toDateTimeString(),
    ];

    $this->actingAs($member)
        ->patch(route('bookings.reschedule', $booking), $payload)
        ->assertSessionHasNoErrors();

    // Replaying the stale submit — the button a cached page still shows.
    $this->actingAs($member)
        ->from(route('bookings.index'))
        ->withHeaders(inertiaHeaders())
        ->patch(route('bookings.reschedule', $booking), $payload)
        ->assertRedirect(route('bookings.index'))
        ->assertSessionHas('inertia.flash_data', [
            'toast' => [
                'type' => 'error',
                'message' => 'This booking is cancelled and can no longer be rescheduled.',
            ],
        ]);

    expect(ResourceBooking::query()->where('rescheduled_from_id', $booking->id)->count())->toBe(1);
});

it('explains the 2-day cutoff rather than just refusing', function () {
    $member = reschedulePlayer();
    $soon = now()->addDay()->setTime(9, 0);
    rescheduleOpenDate($soon->toDateString());

    $booking = rescheduleBookingFor($member, $this->court, $soon);

    $this->actingAs($member)
        ->from(route('bookings.show', $booking))
        ->withHeaders(inertiaHeaders())
        ->get(route('bookings.reschedule.edit', $booking))
        ->assertRedirect(route('bookings.show', $booking))
        ->assertSessionHas('inertia.flash_data', [
            'toast' => [
                'type' => 'error',
                'message' => 'Bookings can only be rescheduled up to 2 days before the start time.',
            ],
        ]);
});

it('explains that a booking can only be rescheduled once', function () {
    $member = reschedulePlayer();
    $booking = rescheduleBookingFor($member, $this->court, $this->from, [
        'rescheduled_from_id' => rescheduleBookingFor($member, $this->court, now()->addDays(4)->setTime(8, 0))->id,
    ]);

    $this->actingAs($member)
        ->from(route('bookings.show', $booking))
        ->withHeaders(inertiaHeaders())
        ->get(route('bookings.reschedule.edit', $booking))
        ->assertRedirect(route('bookings.show', $booking))
        ->assertSessionHas('inertia.flash_data', [
            'toast' => [
                'type' => 'error',
                'message' => 'This booking has already been rescheduled once. Please contact the venue to move it again.',
            ],
        ]);
});

it('does not loop when the refused page is the one the visitor came from', function () {
    $member = reschedulePlayer();
    $soon = now()->addDay()->setTime(9, 0);
    rescheduleOpenDate($soon->toDateString());

    $booking = rescheduleBookingFor($member, $this->court, $soon);

    $this->actingAs($member)
        ->from(route('bookings.reschedule.edit', $booking))
        ->withHeaders(inertiaHeaders())
        ->get(route('bookings.reschedule.edit', $booking))
        ->assertRedirect(url('/'));
});

it('still answers a plain 403 outside Inertia', function () {
    $booking = rescheduleBookingFor(reschedulePlayer(), $this->court, $this->from);

    $this->actingAs(reschedulePlayer())
        ->get(route('bookings.reschedule.edit', $booking))
        ->assertForbidden();
});
