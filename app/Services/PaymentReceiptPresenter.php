<?php

namespace App\Services;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Models\OpenPlayRegistration;
use App\Models\Payment;
use App\Models\ResourceBooking;
use App\Models\Setting;
use App\Models\User;

/**
 * Builds the e-receipt a customer sees once their payment is confirmed.
 *
 * A receipt is a view of the Payment that settled something: its invoice
 * number, what was actually charged, and when. The payable only contributes
 * the line items. Null until such a payment exists — a booking marked paid at
 * the desk has no Payment row, so there is nothing truthful to print.
 */
class PaymentReceiptPresenter
{
    /**
     * @return array<string, mixed>|null
     */
    public function forBooking(ResourceBooking $booking): ?array
    {
        if ($booking->payment_status !== PaymentStatus::Paid) {
            return null;
        }

        // One QR pays for a whole bulk submission, and the Payment hangs off
        // whichever booking the customer checked out from — not necessarily
        // the one being viewed.
        $slots = $booking->groupBookings()->load('resource');
        $payment = $this->settlingPayment($booking->getMorphClass(), $slots->modelKeys());

        if ($payment === null) {
            return null;
        }

        $first = $slots->first() ?? $booking;
        $sport = $first->resource?->sport->label() ?? __('Court');

        return $this->receipt(
            payment: $payment,
            customer: $booking->user,
            title: $slots->count() > 1
                ? __(':sport · :count slots', ['sport' => $sport, 'count' => $slots->count()])
                : $sport.' · '.($first->resource?->name ?? __('Court')),
            note: __('Your booking is confirmed. Show this receipt at the front desk when you arrive — no further action needed.'),
            items: $slots->map(fn (ResourceBooking $slot): array => [
                'label' => $slot->resource?->name ?? __('Court'),
                'starts_at' => $slot->starts_at->toIso8601String(),
                'ends_at' => $slot->ends_at->toIso8601String(),
                'players' => null,
                'amount' => round((float) $slot->amount, 2),
            ])->values()->all(),
        );
    }

    /**
     * @return array<string, mixed>|null
     */
    public function forOpenPlayRegistration(OpenPlayRegistration $registration): ?array
    {
        if ($registration->payment_status !== PaymentStatus::Paid) {
            return null;
        }

        $payment = $this->settlingPayment($registration->getMorphClass(), [$registration->getKey()]);

        if ($payment === null) {
            return null;
        }

        $registration->loadMissing(['openPlaySession', 'player.user']);
        $session = $registration->openPlaySession;

        // The lead's payment also covers a doubles partner or the friends they
        // brought along, so the head count is the whole party.
        $players = 1
            + ($registration->partner_player_id !== null ? 1 : 0)
            + $registration->groupMembers()->count();

        return $this->receipt(
            payment: $payment,
            customer: $registration->player?->user,
            title: __('Open Play · :title', ['title' => $session->title]),
            note: __("You're registered. Show this receipt at the front desk on the day of the session."),
            items: [[
                'label' => __('Open Play entry'),
                'starts_at' => $session->starts_at->toIso8601String(),
                'ends_at' => $session->ends_at?->toIso8601String(),
                'players' => $players,
                'amount' => round((float) $registration->amount, 2),
            ]],
        );
    }

    /**
     * @param  array<int, mixed>  $payableIds
     */
    private function settlingPayment(string $payableType, array $payableIds): ?Payment
    {
        return Payment::query()
            ->where('payable_type', $payableType)
            ->whereIn('payable_id', $payableIds)
            ->where('status', PaymentStatus::Paid)
            // A flagged payment is a duplicate or late charge waiting to be
            // refunded; the receipt belongs to the one that actually settled it.
            ->whereNull('flagged_at')
            ->latest('paid_at')
            ->first();
    }

    /**
     * @param  list<array<string, mixed>>  $items
     * @return array<string, mixed>
     */
    private function receipt(Payment $payment, ?User $customer, string $title, string $note, array $items): array
    {
        $customer ??= $payment->user;
        $total = round((float) $payment->amount, 2);
        $fee = round((float) $payment->convenience_fee, 2);

        return [
            'reference' => $payment->invoice_number,
            'venue' => $this->venue(),
            'title' => $title,
            'note' => $note,
            'customer' => [
                'name' => $customer?->name,
                'phone' => $customer?->phone,
            ],
            'items' => $items,
            // The Payment is the record of what was charged; line items are
            // only the breakdown, so totals never come from summing them.
            'subtotal' => round($total - $fee, 2),
            'fee' => $fee,
            'total' => $total,
            'method' => PaymentMethod::tryFrom((string) $payment->payment_method)?->label() ?? __('Online payment'),
            'paid_at' => ($payment->paid_at ?? now())->toIso8601String(),
            // Front-desk staff scan this to open the live payment record, so a
            // doctored screenshot can't pass for a real receipt.
            'verify_url' => route('payments.show', $payment),
        ];
    }

    /**
     * @return array{name: string, address: string|null}
     */
    private function venue(): array
    {
        $profile = Setting::query()
            ->where('group', 'venue')
            ->where('key', 'profile')
            ->value('value') ?? [];

        $address = collect([$profile['city'] ?? null, $profile['state'] ?? null])
            ->filter(fn (mixed $part): bool => filled($part))
            ->implode(', ');

        return [
            // Same fallback as the emailed receipt, so both name the venue alike.
            'name' => $profile['name'] ?? config('app.name'),
            'address' => $address !== '' ? $address : null,
        ];
    }
}
