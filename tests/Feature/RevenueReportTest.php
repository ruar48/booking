<?php

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Enums\RentalStatus;
use App\Enums\SaleStatus;
use App\Models\OpenPlayRegistration;
use App\Models\OpenPlaySession;
use App\Models\Player;
use App\Models\RentalTransaction;
use App\Models\ResourceBooking;
use App\Models\Sale;
use App\Models\User;
use App\Services\RevenueReportService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * The dashboard's Sales card: every income source, per day / week / month.
 * "Now" is pinned to Wednesday 7 Oct 2026, noon.
 */
beforeEach(function () {
    $this->travelTo(Carbon::parse('2026-10-07 12:00:00'));
});

/** A booking made (and paid) at $bookedAt, for a court a few days later. */
function paidBooking(string $bookedAt, float $amount, PaymentStatus $status = PaymentStatus::Paid): void
{
    $booking = ResourceBooking::factory()->create([
        'starts_at' => Carbon::parse($bookedAt)->addDays(3),
        'ends_at' => Carbon::parse($bookedAt)->addDays(3)->addHour(),
        'payment_status' => $status,
        'amount' => $amount,
    ]);
    $booking->forceFill(['created_at' => Carbon::parse($bookedAt)])->save();
}

function posSale(string $at, float $total, SaleStatus $status = SaleStatus::Completed): void
{
    $sale = Sale::factory()->create(['total' => $total, 'status' => $status]);
    $sale->forceFill(['created_at' => Carbon::parse($at)])->save();
}

function rental(string $rentedAt, float $total, RentalStatus $status = RentalStatus::Returned): void
{
    RentalTransaction::query()->create([
        'staff_id' => User::factory()->create()->id,
        'reference_number' => 'RNT-'.Str::upper(Str::random(8)),
        'rented_at' => Carbon::parse($rentedAt),
        'total_amount' => $total,
        'status' => $status,
    ]);
}

function openPlayFee(string $at, float $amount, PaymentStatus $status = PaymentStatus::Paid): void
{
    $registration = OpenPlayRegistration::query()->create([
        'open_play_session_id' => OpenPlaySession::factory()->create()->id,
        'player_id' => Player::factory()->create()->id,
        'payment_status' => $status,
        'amount' => $amount,
    ]);
    $registration->forceFill(['created_at' => Carbon::parse($at)])->save();
}

it('adds up every source for today, split by source', function () {
    paidBooking('2026-10-07 09:00', 200);
    posSale('2026-10-07 10:00', 55.50);
    rental('2026-10-07 11:00', 100);
    openPlayFee('2026-10-07 08:00', 100);

    $today = app(RevenueReportService::class)->summary()['day']['current'];

    expect($today)->toBe([
        'bookings' => 200.0,
        'walk_in' => 0.0,
        'pos' => 55.5,
        'rentals' => 100.0,
        'open_play' => 100.0,
        'total' => 455.5,
    ]);
});

it('leaves out money that was not actually taken', function () {
    paidBooking('2026-10-07 09:00', 200, PaymentStatus::Unpaid);
    posSale('2026-10-07 10:00', 80, SaleStatus::Voided);
    rental('2026-10-07 11:00', 100, RentalStatus::Reserved);
    openPlayFee('2026-10-07 08:00', 100, PaymentStatus::Unpaid);

    expect(app(RevenueReportService::class)->summary()['day']['current']['total'])->toBe(0.0);
});

it('counts a paid booking for a future date as a sale today', function () {
    ResourceBooking::factory()->create([
        'starts_at' => Carbon::parse('2026-10-11 18:00'),
        'ends_at' => Carbon::parse('2026-10-11 22:00'),
        'payment_status' => PaymentStatus::Paid,
        'amount' => 1000,
    ]);

    expect(app(RevenueReportService::class)->summary()['day']['current']['bookings'])->toBe(1000.0);
});

it('leaves out paid bookings that were later cancelled', function () {
    ResourceBooking::factory()->create([
        'starts_at' => Carbon::parse('2026-10-07 09:00'),
        'ends_at' => Carbon::parse('2026-10-07 10:00'),
        'status' => BookingStatus::Cancelled,
        'payment_status' => PaymentStatus::Paid,
        'amount' => 200,
    ]);

    expect(app(RevenueReportService::class)->summary()['day']['current']['total'])->toBe(0.0);
});

it('reports walk-ins separately, on the day the cash was taken', function () {
    $staff = User::factory()->create();

    ResourceBooking::factory()->create([
        'created_by' => $staff->id,
        'starts_at' => Carbon::parse('2026-10-10 20:00'),
        'ends_at' => Carbon::parse('2026-10-10 21:00'),
        'payment_status' => PaymentStatus::Paid,
        'amount' => 250,
    ]);

    $today = app(RevenueReportService::class)->summary()['day']['current'];

    expect($today['walk_in'])->toBe(250.0)
        ->and($today['bookings'])->toBe(0.0)
        ->and($today['total'])->toBe(250.0);
});

it('buckets by day, Monday-start week, and month, with the previous period', function () {
    paidBooking('2026-10-06 18:00', 250);   // yesterday (Tue), this week, this month
    paidBooking('2026-10-05 07:00', 200);   // Monday: this week
    paidBooking('2026-10-04 07:00', 200);   // Sunday: last week, this month
    paidBooking('2026-09-30 07:00', 200);   // last week, last month

    $summary = app(RevenueReportService::class)->summary();

    expect($summary['day']['buckets'])->toHaveCount(14)
        ->and($summary['day']['current']['total'])->toBe(0.0)
        ->and($summary['day']['previous_total'])->toBe(250.0)
        ->and($summary['week']['buckets'])->toHaveCount(12)
        ->and($summary['week']['current']['total'])->toBe(450.0)
        ->and($summary['week']['previous_total'])->toBe(400.0)
        ->and($summary['month']['buckets'])->toHaveCount(12)
        ->and($summary['month']['current']['total'])->toBe(650.0)
        ->and($summary['month']['previous_total'])->toBe(200.0)
        ->and(collect($summary['month']['buckets'])->last()['label'])->toBe('Oct 2026');
});

it('ignores sales outside the window', function () {
    paidBooking('2025-01-15 09:00', 999);

    expect(collect(app(RevenueReportService::class)->summary()['month']['buckets'])->sum('total'))->toEqual(0);
});
