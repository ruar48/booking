<?php

namespace App\Http\Controllers;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Models\Payment;
use App\Services\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class PaymongoWebhookController extends Controller
{
    public function __construct(
        private readonly PaymentService $paymentService,
    ) {}

    public function handle(Request $request): Response
    {
        if (! $this->hasValidSignature($request)) {
            return response('Invalid signature', 400);
        }

        $event = $request->input('data.attributes.type');
        $paymentIntentId = $this->resolvePaymentIntentId($event, $request);

        if ($paymentIntentId) {
            DB::transaction(function () use ($paymentIntentId): void {
                $payment = Payment::query()
                    ->where('paymongo_payment_intent_id', $paymentIntentId)
                    ->lockForUpdate()
                    ->first();

                if ($payment && $payment->status !== PaymentStatus::Paid) {
                    $this->paymentService->markPaid($payment, PaymentMethod::Qrph->value);
                }
            });
        }

        return response('OK', 200);
    }

    private function resolvePaymentIntentId(?string $event, Request $request): ?string
    {
        return match ($event) {
            'payment_intent.succeeded' => $request->input('data.attributes.data.id'),
            'payment.paid' => $request->input('data.attributes.data.attributes.payment_intent_id'),
            default => null,
        };
    }

    private function hasValidSignature(Request $request): bool
    {
        $secret = config('services.paymongo.webhook_secret');
        $header = $request->header('Paymongo-Signature');

        if (! $secret || ! $header) {
            return false;
        }

        $parts = [];
        foreach (explode(',', $header) as $segment) {
            [$key, $value] = array_pad(explode('=', $segment, 2), 2, null);
            $parts[$key] = $value;
        }

        if (empty($parts['t']) || empty($parts['te'])) {
            return false;
        }

        // Reject stale requests so a captured/replayed payload can't be resubmitted later.
        if (abs(time() - (int) $parts['t']) > 300) {
            return false;
        }

        $expected = hash_hmac('sha256', $parts['t'].'.'.$request->getContent(), $secret);

        return hash_equals($expected, $parts['te']) || (! empty($parts['li']) && hash_equals($expected, $parts['li']));
    }
}
