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

class PaymentService
{
    public function __construct(
        private readonly PaymongoService $paymongo,
        private readonly OpenPlayRegistrationService $openPlayRegistrations,
    ) {}

    public function createQrphPaymentForBooking(ResourceBooking $booking, User $user): Payment
    {
        return $this->createQrphPayment(
            payable: $booking,
            user: $user,
            amount: (string) $booking->amount,
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

        $payment->update([
            'paymongo_payment_intent_id' => $intent['id'],
            'paymongo_payment_method_id' => $paymentMethod['id'],
            'qr_code_url' => $code['image_url'] ?? null,
            'qr_expires_at' => isset($code['expires_at']) ? Carbon::parse($code['expires_at']) : null,
            'raw_response' => $attached,
        ]);

        return $payment->fresh();
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
