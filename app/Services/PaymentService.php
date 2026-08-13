<?php

namespace App\Services;

use App\Enums\BookingStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Events\PaymentSuccessful;
use App\Models\OpenPlayRegistration;
use App\Models\Payment;
use App\Models\ResourceBooking;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaymentService
{
    public function __construct(
        private readonly PaymongoService $paymongo,
        private readonly OpenPlayRegistrationService $openPlayRegistrations,
        private readonly ResourceBookingService $resourceBookings,
    ) {}

    /**
     * @param  string|null  $amount  Overrides $booking->amount — needed when
     *                               $booking is one row of a bulk group
     *                               submission and the QR must cover the
     *                               whole group's total, not just this row
     *                               (see ResourceBookingController::checkout()).
     */
    public function createQrphPaymentForBooking(ResourceBooking $booking, User $user, ?string $amount = null): Payment
    {
        return $this->createQrphPayment(
            payable: $booking,
            user: $user,
            amount: $amount ?? (string) $booking->amount,
            description: "Payment for booking #{$booking->id}",
        );
    }

    public function createQrphPaymentForOpenPlayRegistration(OpenPlayRegistration $registration, User $user): Payment
    {
        return $this->createQrphPayment(
            payable: $registration,
            user: $user,
            amount: (string) $registration->amount,
            description: "Open Play registration #{$registration->id}",
        );
    }

    private function createQrphPayment(Model $payable, User $user, string $amount, string $description): Payment
    {
        $payment = $this->create(
            userId: $user->id,
            payable: $payable,
            amount: $amount,
            currency: 'PHP',
            paymentMethod: PaymentMethod::Qrph->value,
        );

        Log::info('paymongo.qr.generate.start', [
            'payment_id' => $payment->id,
            'payable_type' => $payable->getMorphClass(),
            'payable_id' => $payable->getKey(),
            'amount' => $amount,
        ]);

        $amountCentavos = (int) round(((float) $amount) * 100);

        $intent = $this->paymongo->createPaymentIntent(
            amountCentavos: $amountCentavos,
            description: $description,
        );

        $paymentMethod = $this->paymongo->createPaymentMethod([
            'name' => $user->name,
            'email' => $user->email,
        ]);

        $attached = $this->paymongo->attachPaymentMethod(
            paymentIntentId: $intent['id'],
            clientKey: $intent['attributes']['client_key'],
            paymentMethodId: $paymentMethod['id'],
        );

        $code = $attached['attributes']['next_action']['code'] ?? null;

        // PayMongo's QRPh response doesn't always include an expires_at for
        // the code — without a fallback, qr_expires_at stays null and the
        // "reuse the still-valid pending QR on refresh" lookup in
        // ResourceBookingController::showCheckout() / OpenPlayJoinController
        // (which filters on qr_expires_at > now()) would never match,
        // silently forcing a brand-new payment/QR on every page reload.
        //
        // PayMongo sends expires_at as an ISO8601 string (e.g.
        // "2026-08-12T03:36:11.447765846Z"), not a Unix timestamp — feeding
        // that into Carbon::createFromTimestamp() truncates it to its
        // leading digits ("2026") and yields a near-epoch-zero date,
        // instantly landing in the past. Carbon::parse() handles the actual
        // ISO8601 shape correctly; is_numeric() covers the case where
        // PayMongo does send a bare Unix timestamp.
        //
        // Carbon::parse()/createFromTimestamp() on an offset-bearing input
        // keep the instance in UTC. The `datetime` cast persists a naive
        // "Y-m-d H:i:s" string with no offset, and re-reads it assuming
        // APP_TIMEZONE (Asia/Manila, UTC+8) — so a UTC-labeled instant gets
        // reinterpreted ~8 hours earlier on the very next load unless it's
        // normalized to app timezone before being handed to ->update().
        $rawExpiresAt = $code['expires_at'] ?? null;
        $qrExpiresAt = (match (true) {
            $rawExpiresAt === null => now()->addMinutes(30),
            is_numeric($rawExpiresAt) => Carbon::createFromTimestamp($rawExpiresAt),
            default => Carbon::parse($rawExpiresAt),
        })->setTimezone(config('app.timezone'));

        $payment->update([
            'paymongo_payment_intent_id' => $intent['id'],
            'paymongo_payment_method_id' => $paymentMethod['id'],
            'qr_code_url' => $code['image_url'] ?? null,
            'qr_expires_at' => $qrExpiresAt,
            'raw_response' => $attached,
        ]);

        Log::info('paymongo.qr.generate.done', [
            'payment_id' => $payment->id,
            'paymongo_payment_intent_id' => $intent['id'],
            'has_qr_code_url' => ($code['image_url'] ?? null) !== null,
            'code_keys' => $code ? array_keys($code) : null,
            'expires_at_from_paymongo' => $code['expires_at'] ?? null,
            'qr_expires_at_stored' => $qrExpiresAt->toIso8601String(),
        ]);

        $fresh = $payment->fresh();

        // Re-log after the fresh() re-read from the DB — this is what
        // actually gets handed to the controller/frontend. Comparing this
        // against qr_expires_at_stored above is what would have caught the
        // Eloquent naive-datetime-cast bug immediately, instead of only
        // showing up as a silent "QR code expired" in the browser.
        Log::info('paymongo.qr.generate.fresh_read', [
            'payment_id' => $fresh->id,
            'qr_expires_at_read_back' => $fresh->qr_expires_at?->toIso8601String(),
            'qr_expires_at_is_future' => $fresh->qr_expires_at?->isFuture(),
            'now' => now()->toIso8601String(),
        ]);

        return $fresh;
    }

    public function create(
        int $userId,
        Model $payable,
        string $amount,
        string $currency = 'USD',
        ?string $paymentMethod = null,
        ?string $notes = null,
    ): Payment {
        return DB::transaction(function () use ($userId, $payable, $amount, $currency, $paymentMethod, $notes): Payment {
            return Payment::query()->create([
                'user_id' => $userId,
                'payable_type' => $payable->getMorphClass(),
                'payable_id' => $payable->getKey(),
                'invoice_number' => $this->generateInvoiceNumber(),
                'amount' => $amount,
                'currency' => $currency,
                'status' => PaymentStatus::Pending,
                'payment_method' => $paymentMethod,
                'notes' => $notes,
            ]);
        });
    }

    public function markPaid(Payment $payment, ?string $paymentMethod = null): Payment
    {
        Log::info('payment.mark_paid.start', [
            'payment_id' => $payment->id,
            'payable_type' => $payment->payable_type,
            'payable_id' => $payment->payable_id,
        ]);

        $payment = DB::transaction(function () use ($payment, $paymentMethod): Payment {
            $payment->update([
                'status' => PaymentStatus::Paid,
                'paid_at' => now(),
                'payment_method' => $paymentMethod ?? $payment->payment_method,
            ]);

            $payable = $payment->payable;

            if ($payable && in_array('payment_status', $payable->getFillable(), true)) {
                $updates = ['payment_status' => PaymentStatus::Paid];

                if ($payable instanceof ResourceBooking && $payable->status === BookingStatus::Pending) {
                    $updates['status'] = BookingStatus::Approved;
                }

                $payable->update($updates);

                // One QR payment covers the whole booking_group_id batch
                // (see ResourceBookingController::checkout()) — cascade paid
                // status to the siblings too, or the rest of the group stays
                // Unpaid forever despite the customer having paid for it.
                if ($payable instanceof ResourceBooking) {
                    $this->resourceBookings->markGroupPaid($payable);
                }

                if ($payable instanceof OpenPlayRegistration) {
                    $this->openPlayRegistrations->pairRandomly($payable->openPlaySession);
                }
            }

            return $payment->fresh();
        });

        event(new PaymentSuccessful($payment));

        return $payment;
    }

    public function generateInvoiceNumber(): string
    {
        $prefix = 'INV-'.now()->format('Ymd');
        $latest = Payment::query()
            ->where('invoice_number', 'like', $prefix.'%')
            ->orderByDesc('invoice_number')
            ->value('invoice_number');

        $sequence = 1;

        if ($latest !== null) {
            $sequence = (int) substr($latest, -4) + 1;
        }

        return sprintf('%s-%04d', $prefix, $sequence);
    }
}
