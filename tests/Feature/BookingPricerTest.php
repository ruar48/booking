<?php

use App\Models\Resource;
use App\Services\Booking\BookingPricer;
use Illuminate\Support\Carbon;

/**
 * Courts cost ₱200/hr until 6pm and ₱250/hr from 6pm; a booking that straddles
 * the cutoff is charged at each rate for its share.
 */
beforeEach(function () {
    $this->pricer = new BookingPricer;
    $this->court = Resource::factory()->make(['hourly_rate' => 200, 'evening_rate' => 250]);
});

function priceAt(BookingPricer $pricer, Resource $court, string $from, string $to): float
{
    return $pricer->price($court, Carbon::parse("2026-10-05 {$from}"), Carbon::parse("2026-10-05 {$to}"));
}

it('charges the day rate before 6pm', function () {
    expect(priceAt($this->pricer, $this->court, '05:00', '07:00'))->toBe(400.0);
});

it('charges the evening rate from 6pm', function () {
    expect(priceAt($this->pricer, $this->court, '18:00', '23:00'))->toBe(1250.0);
});

it('splits a booking that straddles 6pm', function () {
    expect(priceAt($this->pricer, $this->court, '17:00', '19:00'))->toBe(450.0)
        ->and(priceAt($this->pricer, $this->court, '17:30', '18:30'))->toBe(225.0);
});

it('uses the day rate all day when there is no evening rate', function () {
    $court = Resource::factory()->make(['hourly_rate' => 150, 'evening_rate' => null]);

    expect(priceAt($this->pricer, $court, '19:00', '21:00'))->toBe(300.0);
});
