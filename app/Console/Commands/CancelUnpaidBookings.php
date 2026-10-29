<?php

namespace App\Console\Commands;

use App\Actions\Booking\ReleaseUnpaidBookings;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('bookings:cancel-unpaid')]
#[Description('Cancel bookings whose payment window has elapsed while still unpaid')]
class CancelUnpaidBookings extends Command
{
    public function handle(ReleaseUnpaidBookings $releaseUnpaid): int
    {
        $count = $releaseUnpaid->execute();

        $this->info("Cancelled {$count} unpaid booking(s).");

        return self::SUCCESS;
    }
}
