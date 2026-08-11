<?php

namespace App\Http\Controllers;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Models\Payment;
use App\Services\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaymongoWebhookController extends Controller
{
    public function __construct(
        private readonly PaymentService $paymentService,
    ) {}

    public function handle(Request $request): Response
    {
        Log::info('paymongo.webhook.received', [
            'ip' => $request->ip(),
            'has_signature_header' => $request->hasHeader('Paymongo-Signature'),
            'event_type' => $request->input('data.attributes.type'),
        ]);

        $signatureFailureReason = $this->signatureFailureReason($request);

        if ($signatureFailureReason !== null) {
            Log::warning('paymongo.webhook.invalid_signature', [
                'ip' => $request->ip(),
                'reason' => $signatureFailureReason,
                'diagnostics' => $this->signatureDiagnostics($request),
            ]);

            return response('Invalid signature', 400);
        }

        $event = $request->input('data.attributes.type');
        $paymentIntentId = $this->resolvePaymentIntentId($event, $request);

        Log::info('paymongo.webhook.resolved', [
            'event' => $event,
            'payment_intent_id' => $paymentIntentId,
        ]);

        if ($paymentIntentId) {
            DB::transaction(function () use ($paymentIntentId): void {
                $payment = Payment::query()
                    ->where('paymongo_payment_intent_id', $paymentIntentId)
                    ->lockForUpdate()
                    ->first();

                if (! $payment) {
                    Log::warning('paymongo.webhook.payment_not_found', ['payment_intent_id' => $paymentIntentId]);

                    return;
                }

                if ($payment->status !== PaymentStatus::Paid) {
                    $this->paymentService->markPaid($payment, PaymentMethod::Qrph->value);

                    Log::info('paymongo.webhook.marked_paid', [
                        'payment_id' => $payment->id,
                        'payable_type' => $payment->payable_type,
                        'payable_id' => $payment->payable_id,
                    ]);
                } else {
                    Log::info('paymongo.webhook.already_paid', ['payment_id' => $payment->id]);
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

    /**
     * Returns null when the signature is valid, otherwise a short reason code
     * for diagnostics. Never logs the secret or computed signature itself.
     */
    private function signatureFailureReason(Request $request): ?string
    {
        $secret = config('services.paymongo.webhook_secret');
        $header = $request->header('Paymongo-Signature');

        if (! $secret) {
            return 'webhook_secret_not_configured';
        }

        if (! $header) {
            return 'missing_signature_header';
        }

        $parts = [];
        foreach (explode(',', $header) as $segment) {
            [$key, $value] = array_pad(explode('=', $segment, 2), 2, null);
            $parts[$key] = $value;
        }

        // PayMongo's header always includes both a te= (test-mode) and li=
        // (live-mode) signature, but only one is actually populated — a live
        // payment leaves te= empty and puts the real signature in li=. Only
        // requiring te here rejected every live webhook before it ever
        // reached the li fallback below.
        if (empty($parts['t']) || (empty($parts['te']) && empty($parts['li']))) {
            return 'malformed_signature_header';
        }

        // Reject stale requests so a captured/replayed payload can't be resubmitted later.
        $skewSeconds = abs(time() - (int) $parts['t']);

        if ($skewSeconds > 300) {
            return "timestamp_too_stale (skew: {$skewSeconds}s)";
        }

        $expected = hash_hmac('sha256', $parts['t'].'.'.$request->getContent(), $secret);
        $matches = hash_equals($expected, $parts['te']) || (! empty($parts['li']) && hash_equals($expected, $parts['li']));

        return $matches ? null : 'hmac_mismatch';
    }

    /**
     * Safe-to-log diagnostics for a signature failure: never the secret, the
     * full computed HMAC, or the full received signature — only shape/length
     * checks that catch copy-paste corruption (trailing whitespace/newlines,
     * wrapping quotes) and structural issues, which is the most common cause
     * of a signature that "looks" configured but never validates.
     *
     * @return array<string, mixed>
     */
    private function signatureDiagnostics(Request $request): array
    {
        $secret = config('services.paymongo.webhook_secret') ?? '';
        $header = $request->header('Paymongo-Signature') ?? '';

        $parts = [];
        foreach (explode(',', $header) as $segment) {
            [$key, $value] = array_pad(explode('=', $segment, 2), 2, null);
            $parts[$key] = $value;
        }

        $timestamp = $parts['t'] ?? null;
        $receivedSignature = ! empty($parts['te']) ? $parts['te'] : ($parts['li'] ?? null);

        $expected = ($secret !== '' && $timestamp)
            ? hash_hmac('sha256', $timestamp.'.'.$request->getContent(), $secret)
            : null;

        return [
            'secret_length' => strlen($secret),
            'secret_has_surrounding_whitespace' => $secret !== trim($secret),
            'secret_prefix' => substr($secret, 0, 5),
            'header_length' => strlen($header),
            'header_keys_found' => array_keys($parts),
            'timestamp_present' => $timestamp !== null,
            'timestamp_skew_seconds' => $timestamp ? abs(time() - (int) $timestamp) : null,
            'received_signature_length' => $receivedSignature ? strlen($receivedSignature) : 0,
            'received_signature_prefix' => $receivedSignature ? substr($receivedSignature, 0, 8) : null,
            'expected_signature_prefix' => $expected ? substr($expected, 0, 8) : null,
            'request_body_length' => strlen($request->getContent()),
            'server_time' => now()->toIso8601String(),
        ];
    }
}
