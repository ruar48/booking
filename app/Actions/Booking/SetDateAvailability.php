<?php

namespace App\Actions\Booking;

use App\Models\DateOverride;
use App\Models\User;

/**
 * Opens or closes a single date for bookings.
 *
 * Dates are closed by default: only a date an admin has explicitly opened, with
 * hours, is bookable. Absence of a DateOverride row means closed, which is why
 * closing writes a row rather than deleting one.
 */
class SetDateAvailability
{
    public function open(string $date, string $openTime, string $closeTime, User $admin): DateOverride
    {
        return DateOverride::query()->updateOrCreate(
            ['date' => $date],
            [
                'is_closed' => false,
                'open_time' => $openTime,
                'close_time' => $closeTime,
                'reason' => null,
                'created_by' => $admin->id,
            ],
        );
    }

    public function close(string $date, ?string $reason, User $admin): DateOverride
    {
        return DateOverride::query()->updateOrCreate(
            ['date' => $date],
            [
                'is_closed' => true,
                'open_time' => null,
                'close_time' => null,
                'reason' => $reason,
                'created_by' => $admin->id,
            ],
        );
    }
}
