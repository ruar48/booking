<?php

namespace App\Services;

use App\Enums\PaymentStatus;
use App\Events\PaymentSuccessful;
use App\Models\Payment;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class PaymentService
{
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
