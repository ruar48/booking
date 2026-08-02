<?php

namespace App\Http\Controllers;

use App\Enums\PaymentStatus;
use App\Models\Payment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Payment::class);

        $payments = Payment::query()
            ->with(['user', 'payable'])
            ->when(
                $request->filled('status'),
                fn ($query) => $query->where('status', $request->input('status')),
            )
            ->latest()
            ->paginate();

        return Inertia::render('payments/index', [
            'payments' => $payments,
            'filters' => $request->only(['status']),
        ]);
    }

    public function show(Payment $payment): Response
    {
        $this->authorize('view', $payment);

        $payment->load(['user', 'payable']);

        return Inertia::render('payments/show', [
            'payment' => $payment,
        ]);
    }

    public function markPaid(Request $request, Payment $payment): RedirectResponse
    {
        $this->authorize('markPaid', $payment);

        $validated = $request->validate([
            'payment_method' => ['nullable', 'string', 'max:50'],
            'notes' => ['nullable', 'string'],
        ]);

        $payment->update([
            'status' => PaymentStatus::Paid,
            'paid_at' => now(),
            'payment_method' => $validated['payment_method'] ?? $payment->payment_method,
            'notes' => $validated['notes'] ?? $payment->notes,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Payment marked as paid.')]);

        return to_route('payments.show', $payment);
    }
}
