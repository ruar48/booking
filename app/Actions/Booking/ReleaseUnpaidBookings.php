<?php

namespace App\Actions\Booking;

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Models\Payment;
use App\Models\ResourceBooking;
use App\Models\Setting;
use App\Services\HomePageService;
use App\Services\ResourceBookingService;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Cancels self-service bookings whose payment window has passed unpaid, so
 * their slots go back on sale. Run every minute by the scheduler, and also
 * lazily from the booking pages so slots still open if the server's cron
 * stops running.
 *
 * It also answers "when will this hold open up?" for the booking grids, from
 * the same rule — so the time customers are shown is the time it releases.
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
        $minutes = $this->windowMinutes();

        if ($minutes === null) {
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

        $heldUntil = $this->holdExpiries($overdueBookings, $minutes);

        $releasable = $overdueBookings->filter(
            fn (ResourceBooking $booking) => $heldUntil[$booking->id]->lte(now()),
        );

        foreach ($releasable as $booking) {
            $this->resourceBookingService->cancel(
                $booking,
                'Auto-cancelled: payment was not received within the allotted time.',
            );
        }

        if ($releasable->isNotEmpty()) {
            // The home page caches its slot grid; released slots must show at once.
            HomePageService::forget();
        }

        return $releasable->count();
    }

    /**
     * When each unpaid hold among $bookings opens up again, keyed by booking
     * id. Bookings that aren't an auto-releasing hold (paid, approved, or the
     * venue has no payment window) are absent.
     *
     * @param  Collection<int, ResourceBooking>  $bookings  Needs id, status,
     *                                                      payment_status,
     *                                                      created_at and
     *                                                      booking_group_id.
     * @return array<int, CarbonInterface>
     */
    public function heldUntil(Collection $bookings): array
    {
        $minutes = $this->windowMinutes();

        if ($minutes === null) {
            return [];
        }

        $holds = $bookings->filter(
            fn (ResourceBooking $booking) => $booking->status === BookingStatus::Pending
                && $booking->payment_status === PaymentStatus::Unpaid,
        );

        return $this->holdExpiries($holds, $minutes);
    }

    /**
     * Booking rows as the slot grids consume them, each carrying `held_until`
     * — when an unpaid hold opens up again (null for a confirmed booking), so
     * customers can see the slot isn't gone for good. Only the slot and its
     * timing are exposed, never who holds it.
     *
     * @param  Collection<int, ResourceBooking>  $bookings
     * @return Collection<int, array<string, mixed>>
     */
    public function asBookedSlots(Collection $bookings): Collection
    {
        $heldUntil = $this->heldUntil($bookings);

        return $bookings->map(fn (ResourceBooking $booking): array => [
            'id' => $booking->id,
            'resource_id' => $booking->resource_id,
            'starts_at' => $booking->starts_at->toJSON(),
            'ends_at' => $booking->ends_at->toJSON(),
            'resource' => $booking->resource?->only(['id', 'name']),
            'held_until' => isset($heldUntil[$booking->id]) ? $heldUntil[$booking->id]->toJSON() : null,
        ])->values();
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

    /**
     * A hold lasts until its payment window ends. A customer mid-scan on a
     * still-valid QR keeps it a little longer — until that QR expires, but
     * never more than the grace period past the deadline. The QR hangs off one
     * row of a bulk group, so the whole group shares it.
     *
     * @param  Collection<int, ResourceBooking>  $bookings
     * @return array<int, CarbonInterface>
     */
    private function holdExpiries(Collection $bookings, int $minutes): array
    {
        if ($bookings->isEmpty()) {
            return [];
        }

        $liveQrExpiry = Payment::query()
            ->where('payable_type', (new ResourceBooking)->getMorphClass())
            ->whereIn('payable_id', $bookings->pluck('id'))
            ->where('status', PaymentStatus::Pending)
            ->where('qr_expires_at', '>', now())
            ->get(['payable_id', 'qr_expires_at'])
            ->groupBy('payable_id')
            ->map(fn (Collection $payments) => $payments->max('qr_expires_at'));

        $groupQrExpiry = [];

        foreach ($bookings as $booking) {
            if ($booking->booking_group_id !== null && $liveQrExpiry->has($booking->id)) {
                $groupQrExpiry[$booking->booking_group_id] = $liveQrExpiry[$booking->id];
            }
        }

        $expiries = [];

        foreach ($bookings as $booking) {
            $deadline = $booking->created_at->addMinutes($minutes);
            $qrExpiry = $liveQrExpiry[$booking->id]
                ?? ($booking->booking_group_id !== null ? ($groupQrExpiry[$booking->booking_group_id] ?? null) : null);

            $expiries[$booking->id] = $qrExpiry !== null && $qrExpiry->gt($deadline)
                ? $qrExpiry->min($deadline->addMinutes(self::QR_GRACE_MINUTES))
                : $deadline;
        }

        return $expiries;
    }

    private function windowMinutes(): ?int
    {
        $minutes = (int) Setting::query()
            ->where('group', 'bookings')
            ->where('key', 'unpaid_cancel_minutes')
            ->value('value');

        return $minutes > 0 ? $minutes : null;
    }
}
