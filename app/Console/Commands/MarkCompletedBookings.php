<?php

namespace App\Console\Commands;

use App\Enums\BookingStatus;
use App\Models\ResourceBooking;
use App\Services\ResourceBookingService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('bookings:mark-completed')]
#[Description('Mark approved bookings as completed once their end time has passed')]
class MarkCompletedBookings extends Command
{
    public function handle(ResourceBookingService $resourceBookingService): int
    {
        $dueBookings = ResourceBooking::query()
            ->where('status', BookingStatus::Approved)
            ->where('ends_at', '<=', now())
            ->get();

        foreach ($dueBookings as $booking) {
            $resourceBookingService->complete($booking);
        }

        $this->info("Marked {$dueBookings->count()} booking(s) as completed.");

        return self::SUCCESS;
    }
}
