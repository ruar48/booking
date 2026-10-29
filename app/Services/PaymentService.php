<?php

namespace App\Services;

use App\Enums\BookingStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Events\PaymentSuccessful;
use App\Exceptions\PaymentUnavailableException;
use App\Models\OpenPlayRegistration;
use App\Models\Payment;
use App\Models\ResourceBooking;
use App\Models\User;
use App\Support\ConvenienceFee;
use Carbon\Carbon;
use Illuminate\Contracts\Cache\LockTimeoutException;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Throwable;

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
     *
     * @throws PaymentUnavailableException
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

    /**
     * @throws PaymentUnavailableException
     */
    public function createQrphPaymentForOpenPlayRegistration(OpenPlayRegistration $registration, User $user): Payment
    {
        return $this->createQrphPayment(
            payable: $registration,
            user: $user,
            amount: (string) $registration->amount,
            description: "Open Play registration #{$registration->id}",
        );
    }

    /**
     * One QR generation per payable at a time: a double-click or two open tabs
     * would otherwise create two live PayMongo QRs for the same booking, and a
     * customer who pays both is charged twice.
     *
     * @throws PaymentUnavailableException
     */
    private function createQrphPayment(Model $payable, User $user, string $amount, string $description): Payment
    {
        $lock = Cache::lock("payments:qrph:{$payable->getMorphClass()}:{$payable->getKey()}", 60);

        try {
            return $lock->block(20, fn (): Payment => $this->startQrphPayment($payable, $user, $amount, $description));
        } catch (LockTimeoutException) {
            throw new PaymentUnavailableException;
        }
    }

    /**
     * @throws PaymentUnavailableException
     */
    private function startQrphPayment(Model $payable, User $user, string $amount, string $description): Payment
    {
        // Re-read under the lock: a webhook may have confirmed payment while
        // this request was waiting its turn.
        $payable->refresh();

        if ($payable->payment_status === PaymentStatus::Paid) {
            throw new PaymentUnavailableException(__('This has already been paid.'));
        }

        // The customer shoulders PayMongo's fee: they are charged price + fee
        // so the venue nets the full price. $amount arrives as the price only.
        $charge = ConvenienceFee::for($amount);
        $amount = number_format($charge['total'], 2, '.', '');

        // A still-valid QR for the same amount is handed back instead of
        // minting a second one the customer could also pay.
        $reusable = $payable->payments()
            ->where('payment_method', PaymentMethod::Qrph->value)
            ->where('status', PaymentStatus::Pending)
            ->whereNotNull('qr_code_url')
            ->where('qr_expires_at', '>', now()->addMinute())
            ->where('amount', $amount)
            ->latest('id')
            ->first();

        if ($reusable) {
            Log::info('paymongo.qr.generate.reused', ['payment_id' => $reusable->id]);

            return $reusable;
        }

        $payment = $this->create(
            userId: $user->id,
            payable: $payable,
            amount: $amount,
            convenienceFee: number_format($charge['fee'], 2, '.', ''),
            currency: 'PHP',
            paymentMethod: PaymentMethod::Qrph->value,
        );

        Log::info('paymongo.qr.generate.start', [
            'payment_id' => $payment->id,
            'payable_type' => $payable->getMorphClass(),
            'payable_id' => $payable->getKey(),
            'amount' => $amount,
        ]);

        $amountCentavos = $this->toCentavos($amount);

        try {
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

            if (empty($code['image_url'])) {
                throw new RuntimeException('PayMongo returned no QR image.');
            }
        } catch (Throwable $e) {
            // Without this the half-made row stays Pending with no QR, and the
            // checkout page sits on "Preparing payment…" forever.
            $payment->update([
                'status' => PaymentStatus::Failed,
                'paymongo_payment_intent_id' => $intent['id'] ?? null,
                'notes' => 'QR generation failed.',
            ]);

            Log::error('paymongo.qr.generate.failed', [
                'payment_id' => $payment->id,
                'payable_type' => $payable->getMorphClass(),
                'payable_id' => $payable->getKey(),
                'exception' => $e::class,
                'error' => $e->getMessage(),
            ]);

            throw new PaymentUnavailableException;
        }

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
            'qr_code_url' => $code['image_url'],
            'qr_expires_at' => $qrExpiresAt,
            'raw_response' => $attached,
        ]);

        Log::info('paymongo.qr.generate.done', [
            'payment_id' => $payment->id,
            'paymongo_payment_intent_id' => $intent['id'],
            'code_keys' => array_keys($code),
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

    /**
     * Apply a verified PayMongo "paid" webhook. Idempotent: PayMongo retries
     * deliveries, and both payment.paid and payment_intent.succeeded can
     * arrive for the same charge.
     *
     * @param  int|null  $paidCentavos  The amount PayMongo says it collected.
     */
    public function confirmGatewayPayment(string $paymentIntentId, ?int $paidCentavos): void
    {
        DB::transaction(function () use ($paymentIntentId, $paidCentavos): void {
            $payment = Payment::query()
                ->where('paymongo_payment_intent_id', $paymentIntentId)
                ->lockForUpdate()
                ->first();

            if (! $payment) {
                Log::warning('paymongo.webhook.payment_not_found', ['payment_intent_id' => $paymentIntentId]);

                return;
            }

            if ($payment->status === PaymentStatus::Paid) {
                Log::info('paymongo.webhook.already_paid', ['payment_id' => $payment->id]);

                return;
            }

            $expectedCentavos = $this->toCentavos((string) $payment->amount);

            // We create every intent ourselves, so a mismatch should never
            // happen — if it does, something is wrong and nothing gets
            // confirmed until a person has looked at it.
            if ($paidCentavos !== null && $paidCentavos !== $expectedCentavos) {
                Log::error('paymongo.webhook.amount_mismatch', [
                    'payment_id' => $payment->id,
                    'expected_centavos' => $expectedCentavos,
                    'paid_centavos' => $paidCentavos,
                ]);

                $payment->update([
                    'flagged_at' => now(),
                    'notes' => "Amount mismatch: PayMongo reported {$paidCentavos} centavos, expected {$expectedCentavos}. Review required.",
                ]);

                return;
            }

            if ($paidCentavos === null) {
                Log::warning('paymongo.webhook.amount_missing', ['payment_id' => $payment->id]);
            }

            $this->markPaid($payment, PaymentMethod::Qrph->value);

            Log::info('paymongo.webhook.marked_paid', [
                'payment_id' => $payment->id,
                'payable_type' => $payment->payable_type,
                'payable_id' => $payment->payable_id,
            ]);
        });
    }

    public function create(
        int $userId,
        Model $payable,
        string $amount,
        string $currency = 'USD',
        ?string $paymentMethod = null,
        ?string $notes = null,
        string $convenienceFee = '0',
    ): Payment {
        // Two checkouts in the same instant can compute the same next invoice
        // number; the unique index rejects the second, so take the next one.
        for ($attempt = 1; ; $attempt++) {
            try {
                return DB::transaction(fn (): Payment => Payment::query()->create([
                    'user_id' => $userId,
                    'payable_type' => $payable->getMorphClass(),
                    'payable_id' => $payable->getKey(),
                    'invoice_number' => $this->generateInvoiceNumber(),
                    'amount' => $amount,
                    'convenience_fee' => $convenienceFee,
                    'currency' => $currency,
                    'status' => PaymentStatus::Pending,
                    'payment_method' => $paymentMethod,
                    'notes' => $notes,
                ]));
            } catch (UniqueConstraintViolationException $e) {
                if ($attempt >= 5) {
                    throw $e;
                }
            }
        }
    }

    public function markPaid(Payment $payment, ?string $paymentMethod = null): Payment
    {
        Log::info('payment.mark_paid.start', [
            'payment_id' => $payment->id,
            'payable_type' => $payment->payable_type,
            'payable_id' => $payment->payable_id,
        ]);

        $payment = DB::transaction(function () use ($payment, $paymentMethod): Payment {
            $payable = $payment->payable;

            // Money was received either way, so the payment is always
            // recorded as paid — what changes is whether the thing it paid
            // for can still honour it.
            $payment->update([
                'status' => PaymentStatus::Paid,
                'paid_at' => now(),
                'payment_method' => $paymentMethod ?? $payment->payment_method,
            ]);

            if (! $payable || ! in_array('payment_status', $payable->getFillable(), true)) {
                return $payment->fresh();
            }

            // Paid twice (two QRs scanned, or staff marked it paid at the
            // desk first). The first payment stands; this one is refunded.
            if ($payable->payment_status === PaymentStatus::Paid) {
                $this->flagForRefund($payment, 'Duplicate payment: this was already paid. Refund required.');

                return $payment->fresh();
            }

            if ($payable instanceof ResourceBooking && $payable->status === BookingStatus::Cancelled) {
                if (! $this->resourceBookings->reinstatePaidGroup($payable)) {
                    $this->flagForRefund($payment, 'Paid after the booking was cancelled and its slot is no longer available. Refund required.');
                }

                return $payment->fresh();
            }

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
                $this->openPlayRegistrations->markGroupPaid($payable);
                $this->openPlayRegistrations->pairRandomly($payable->openPlaySession);
            }

            return $payment->fresh();
        });

        // Announced only once the paid status is committed, and never allowed
        // to undo it: the event broadcasts synchronously, and a websocket
        // outage must not roll back a payment the customer has already made.
        DB::afterCommit(function () use ($payment): void {
            try {
                event(new PaymentSuccessful($payment));
            } catch (Throwable $e) {
                Log::error('payment.mark_paid.announce_failed', [
                    'payment_id' => $payment->id,
                    'exception' => $e::class,
                    'error' => $e->getMessage(),
                ]);
            }
        });

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

    /**
     * Record that staff refunded a flagged payment (the refund itself is made
     * in the PayMongo dashboard). Only flagged payments qualify: a normal
     * booking is final under the venue's policy, so there is no general
     * "refund" button.
     */
    public function markRefunded(Payment $payment, User $staff, ?string $note = null): Payment
    {
        $payment->update([
            'status' => PaymentStatus::Refunded,
            'flagged_at' => null,
            'notes' => trim(implode(' ', array_filter([
                $payment->notes,
                "Refunded by {$staff->name} on ".now()->toDateTimeString().'.',
                $note,
            ]))),
        ]);

        Log::info('payment.refunded', ['payment_id' => $payment->id, 'staff_id' => $staff->id]);

        return $payment;
    }

    private function flagForRefund(Payment $payment, string $reason): void
    {
        $payment->update([
            'flagged_at' => now(),
            'notes' => trim(($payment->notes ? $payment->notes.' ' : '').$reason),
        ]);

        Log::error('payment.refund_required', [
            'payment_id' => $payment->id,
            'invoice_number' => $payment->invoice_number,
            'payable_type' => $payment->payable_type,
            'payable_id' => $payment->payable_id,
            'amount' => $payment->amount,
            'reason' => $reason,
        ]);
    }

    private function toCentavos(string $amount): int
    {
        return (int) round(((float) $amount) * 100);
    }
}
