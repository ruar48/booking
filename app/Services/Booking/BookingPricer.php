<?php

namespace App\Services\Booking;

use App\Models\Resource;
use Carbon\CarbonInterface;

/**
 * Prices a booking from the resource's rates.
 *
 * A resource may charge a higher evening rate from EVENING_STARTS onwards. A
 * booking that straddles the cutoff is split, so 5pm–7pm is one hour at the day
 * rate and one at the evening rate. Without an evening rate the day rate
 * applies all day.
 */
class BookingPricer
{
    public const EVENING_STARTS = '18:00';

    public function price(Resource $resource, CarbonInterface $startsAt, CarbonInterface $endsAt): float
    {
        $totalMinutes = max(0, $startsAt->diffInMinutes($endsAt));
        $eveningMinutes = $resource->evening_rate !== null
            ? $this->eveningMinutes($startsAt, $endsAt)
            : 0;
        $dayMinutes = $totalMinutes - $eveningMinutes;

        $amount = (float) $resource->hourly_rate * $dayMinutes / 60
            + (float) $resource->evening_rate * $eveningMinutes / 60;

        return round($amount, 2);
    }

    private function eveningMinutes(CarbonInterface $startsAt, CarbonInterface $endsAt): int
    {
        $eveningStarts = $startsAt->copy()->setTimeFromTimeString(self::EVENING_STARTS);
        $from = $startsAt->greaterThan($eveningStarts) ? $startsAt : $eveningStarts;

        return $endsAt->greaterThan($from) ? (int) $from->diffInMinutes($endsAt) : 0;
    }
}
