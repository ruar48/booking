<?php

namespace App\Jobs;

use App\Models\ResourceBooking;
use App\Notifications\BookingReminderNotification;

class SendBookingReminderJob
{
    public function __construct(
        public readonly ResourceBooking $booking,
    ) {}

    public function handle(): void
    {
        $this->booking->loadMissing(['user', 'resource']);

        if ($this->booking->user === null) {
            return;
        }

        $this->booking->user->notify(
            new BookingReminderNotification($this->booking),
        );
    }
}
