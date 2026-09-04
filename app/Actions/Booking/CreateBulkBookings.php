<?php

namespace App\Actions\Booking;

use App\Events\BookingFailed;
use App\Exceptions\BookingConflictException;
use App\Models\ResourceBooking;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * Creates every slot from one multi-slot submission.
 *
 * Runs from a single calendar submission (a multi-hour or multi-court
 * selection). Those bookings share a booking_group_id so checkout can total and
 * charge them together instead of only billing the first; a lone booking needs
 * no group.
 */
class CreateBulkBookings
{
    public function __construct(
        private readonly CreateBooking $createBooking,
    ) {}

    /**
     * @param  array<int, array<string, mixed>>  $bookings
     * @return ResourceBooking The first booking, to redirect checkout at.
     *
     * @throws BookingConflictException
     */
    public function execute(array $bookings, User $user): ResourceBooking
    {
        $bookingGroupId = count($bookings) > 1 ? (string) Str::uuid() : null;
        $first = null;

        foreach ($bookings as $data) {
            try {
                $booking = $this->createBooking->execute($data, $user->id, $bookingGroupId);
            } catch (BookingConflictException $e) {
                // Recorded per failing slot so the venue can see which
                // selections are colliding, then rethrown for the caller to
                // surface as a validation error.
                event(new BookingFailed(
                    $user,
                    (int) $data['resource_id'],
                    Carbon::parse($data['starts_at']),
                    Carbon::parse($data['ends_at']),
                    $e->getMessage(),
                ));

                throw $e;
            }

            $first ??= $booking;
        }

        return $first;
    }
}
