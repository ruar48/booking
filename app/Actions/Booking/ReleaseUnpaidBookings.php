<?php

namespace App\Actions\Booking;

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Models\Payment;
use App\Models\ResourceBooking;
use App\Models\Setting;
use App\Services\ResourceBookingService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Cancels self-service bookings whose payment window has passed unpaid, so
 * their slots go back on sale. Run every minute by the scheduler, and also
 * lazily from the booking pages so slots still open if the server's cron
 * stops running.
 */
class ReleaseUnpaidBookings
{
    /**
     * How long past the deadline a booking is held for a customer who is
     * mid-scan on a still-valid QR. Bounded, because PayMongo's QR can outlive
     * the payment window by a lot; a payment landing later than this is
     * handled by PaymentService (reinstated if the slot is free, else flagged
     * for refund).
     */
    public const QR_GRACE_MINUTES = 15;

    public function __construct(
        private readonly ResourceBookingService $resourceBookingService,
    ) {}

    /**
     * @return int Number of bookings cancelled.
     */
    public function execute(): int
    {
        $minutes = (int) Setting::query()
            ->where('group', 'bookings')
            ->where('key', 'unpaid_cancel_minutes')
            ->value('value');

        if ($minutes <= 0) {
            return 0;
        }

        // Scoped to Pending only: those are self-service bookings still awaiting
        // the customer's own checkout payment. Approved-but-unpaid bookings (e.g.
        // staff-confirmed walk-ins meant to be paid later) are left alone.
        $overdueBookings = ResourceBooking::query()
            ->where('payment_status', PaymentStatus::Unpaid)
            ->where('status', BookingStatus::Pending)
            ->where('created_at', '<=', now()->subMinutes($minutes))
            ->get();

        // A customer may be mid-scan on a QR that PayMongo will still accept,
        // so a booking with a live QR waits — up to the grace period. The QR
        // hangs off one row of a bulk group, so the whole group waits with it.
        $graceCutoff = now()->subMinutes($minutes + self::QR_GRACE_MINUTES);

        $payingBookingIds = Payment::query()
            ->where('payable_type', (new ResourceBooking)->getMorphClass())
            ->whereIn('payable_id', $overdueBookings->where('created_at', '>', $graceCutoff)->pluck('id'))
            ->where('status', PaymentStatus::Pending)
            ->where('qr_expires_at', '>', now())
            ->pluck('payable_id');

        $payingGroupIds = $overdueBookings
            ->whereIn('id', $payingBookingIds)
            ->pluck('booking_group_id')
            ->filter();

        $overdueBookings = $overdueBookings->reject(
            fn (ResourceBooking $booking) => $payingBookingIds->contains($booking->id)
                || ($booking->booking_group_id !== null && $payingGroupIds->contains($booking->booking_group_id)),
        );

        foreach ($overdueBookings as $booking) {
            $this->resourceBookingService->cancel(
                $booking,
                'Auto-cancelled: payment was not received within the allotted time.',
            );
        }

        return $overdueBookings->count();
    }

    /**
     * The page-load fallback: at most once a minute, and never allowed to
     * break the page it runs on.
     *
     * @return int Number of bookings cancelled (0 when skipped or failed).
     */
    public function executeThrottled(): int
    {
        if (! Cache::add('bookings:release-unpaid', true, 60)) {
            return 0;
        }

        try {
            return $this->execute();
        } catch (Throwable $e) {
            Log::error('bookings.release_unpaid.failed', [
                'exception' => $e::class,
                'error' => $e->getMessage(),
            ]);

            return 0;
        }
    }
}
