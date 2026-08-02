<?php

namespace App\Jobs;

use App\Models\CourtBooking;
use App\Notifications\BookingReminderNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SendBookingReminderJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly CourtBooking $booking,
    ) {}

    public function handle(): void
    {
        $this->booking->loadMissing(['user', 'court']);

        if ($this->booking->user === null) {
            return;
        }

        $this->booking->user->notify(
            new BookingReminderNotification($this->booking),
        );
    }
}
