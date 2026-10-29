<?php

namespace App\Http\Controllers;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Models\Payment;
use App\Services\PaymentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
    public function __construct(
        private readonly PaymentService $paymentService,
    ) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Payment::class);

        $status = $request->input('status');

        $payments = Payment::query()
            ->with(['user', 'payable'])
            ->when(
                $status === 'flagged',
                fn ($query) => $query->whereNotNull('flagged_at'),
                fn ($query) => $query->when(
                    PaymentStatus::tryFrom((string) $status),
                    fn ($query, PaymentStatus $value) => $query->where('status', $value),
                ),
            )
            ->latest()
            ->paginate()
            ->withQueryString();

        return Inertia::render('payments/index', [
            'payments' => $payments,
            'filters' => $request->only(['status']),
            'flaggedCount' => Payment::query()->whereNotNull('flagged_at')->count(),
        ]);
    }

    public function show(Request $request, Payment $payment): Response
    {
        $this->authorize('view', $payment);

        $payment->load(['user', 'payable']);

        return Inertia::render('payments/show', [
            'payment' => $payment,
            'canMarkRefunded' => $request->user()->can('markRefunded', $payment),
        ]);
    }

    public function markPaid(Request $request, Payment $payment): RedirectResponse
    {
        $this->authorize('markPaid', $payment);

        $validated = $request->validate([
            'payment_method' => ['nullable', Rule::enum(PaymentMethod::class)],
            'notes' => ['nullable', 'string'],
        ]);

        if (in_array($payment->status, [PaymentStatus::Paid, PaymentStatus::Refunded], true)) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('This payment is already settled.')]);

            return to_route('payments.show', $payment);
        }

        if (isset($validated['notes'])) {
            $payment->update(['notes' => $validated['notes']]);
        }

        // Through the service so the booking / registration it pays for is
        // marked paid too, not just this payment row.
        $this->paymentService->markPaid($payment, $validated['payment_method'] ?? null);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Payment marked as paid.')]);

        return to_route('payments.show', $payment);
    }

    public function markRefunded(Request $request, Payment $payment): RedirectResponse
    {
        $this->authorize('markRefunded', $payment);

        $validated = $request->validate([
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $this->paymentService->markRefunded($payment, $request->user(), $validated['notes'] ?? null);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Payment recorded as refunded.')]);

        return to_route('payments.show', $payment);
    }
}
