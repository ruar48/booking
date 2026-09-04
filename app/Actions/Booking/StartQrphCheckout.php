<?php

namespace App\Actions\Booking;

use App\Enums\PaymentStatus;
use App\Models\ResourceBooking;
use App\Models\User;
use App\Services\PaymentService;
use Illuminate\Support\Facades\Log;

/**
 * Generates the QR Ph payment covering a booking (and its bulk-submission
 * siblings), returning the payload the checkout screen renders.
 */
class StartQrphCheckout
{
    public function __construct(
        private readonly PaymentService $paymentService,
    ) {}

    /**
     * @return array<string, mixed>|null Null when the booking is already paid.
     */
    public function execute(ResourceBooking $booking, User $payer): ?array
    {
        if ($booking->payment_status === PaymentStatus::Paid) {
            return null;
        }

        // A bulk submission may have split into several bookings sharing a
        // booking_group_id — the QR must cover all of them, or the customer is
        // charged for only a fraction of what they booked.
        $groupTotal = (string) round((float) $booking->groupBookings()->sum('amount'), 2);

        $payment = $this->paymentService->createQrphPaymentForBooking($booking, $payer, $groupTotal);

        Log::info('checkout.generate.qr_state', [
            'booking_id' => $booking->id,
            'payment_id' => $payment->id,
            'qr_expires_at' => $payment->qr_expires_at?->toIso8601String(),
            'qr_expires_at_is_future' => $payment->qr_expires_at?->isFuture(),
            'now' => now()->toIso8601String(),
        ]);

        return [
            'id' => $payment->id,
            'qrCodeUrl' => $payment->qr_code_url,
            'expiresAt' => $payment->qr_expires_at,
        ];
    }
}
