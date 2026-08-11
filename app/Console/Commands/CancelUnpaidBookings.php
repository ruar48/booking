<?php

namespace App\Console\Commands;

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Models\ResourceBooking;
use App\Models\Setting;
use App\Services\ResourceBookingService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('bookings:cancel-unpaid')]
#[Description('Cancel bookings whose payment window has elapsed while still unpaid')]
class CancelUnpaidBookings extends Command
{
    public function handle(ResourceBookingService $resourceBookingService): int
    {
        $minutes = Setting::query()
            ->where('group', 'bookings')
            ->where('key', 'unpaid_cancel_minutes')
            ->value('value');

        if (! $minutes) {
            return self::SUCCESS;
        }

        // Scoped to Pending only: those are self-service bookings still awaiting
        // the customer's own checkout payment. Approved-but-unpaid bookings (e.g.
        // staff-confirmed walk-ins meant to be paid later) are left alone.
        $overdueBookings = ResourceBooking::query()
            ->where('payment_status', PaymentStatus::Unpaid)
            ->where('status', BookingStatus::Pending)
            ->where('created_at', '<=', now()->subMinutes((int) $minutes))
            ->get();

        foreach ($overdueBookings as $booking) {
            $resourceBookingService->cancel(
                $booking,
                'Auto-cancelled: payment was not received within the allotted time.',
            );
        }

        $this->info("Cancelled {$overdueBookings->count()} unpaid booking(s).");

        return self::SUCCESS;
    }
}
