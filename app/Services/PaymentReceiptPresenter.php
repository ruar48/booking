<?php

namespace App\Services;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Models\OpenPlayRegistration;
use App\Models\Payment;
use App\Models\ResourceBooking;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * Builds the e-receipt for a payment: the copy that prints on the checkout
 * confirmation step, the image a customer saves from it, and the emailed copy.
 *
 * A receipt is a view of the Payment that settled something: its invoice
 * number, what was actually charged, and when. The payable only contributes
 * the line items. The printed lines are built here as well, so the screen,
 * the saved image and the email all read the same.
 *
 * @phpstan-type ReceiptItem array{label: string, starts_at: string|null, ends_at: string|null, players: int|null, amount: float}
 * @phpstan-type ReceiptLine array<string, mixed>
 */
class PaymentReceiptPresenter
{
    /**
     * The receipt on a booking's checkout page; null until a payment settles
     * it. A booking marked paid at the desk has no Payment row, so there is
     * nothing truthful to print.
     *
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

        return $payment === null ? null : $this->bookingReceipt($booking, $slots, $payment);
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

        return $payment === null ? null : $this->registrationReceipt($registration, $payment);
    }

    /**
     * The receipt for one particular payment: the emailed copy. Unlike the
     * checkout page it also covers a payment that arrived late or twice, and
     * says that one will be refunded instead of confirming a booking.
     *
     * @return array<string, mixed>
     */
    public function forPayment(Payment $payment): array
    {
        $payable = $payment->payable;

        return match (true) {
            $payable instanceof ResourceBooking => $this->bookingReceipt($payable, $payable->groupBookings()->load('resource'), $payment),
            $payable instanceof OpenPlayRegistration => $this->registrationReceipt($payable, $payment),
            // No payable to name a guest: receipt() falls back to whoever paid.
            default => $this->receipt($payment, null, __('Payment'), __('Thank you for your payment.'), []),
        };
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
     * @param  Collection<int, ResourceBooking>  $slots
     * @return array<string, mixed>
     */
    private function bookingReceipt(ResourceBooking $booking, Collection $slots, Payment $payment): array
    {
        $first = $slots->first() ?? $booking;
        $sport = $first->resource?->sport->label() ?? __('Court');

        return $this->receipt(
            payment: $payment,
            customer: $booking->user,
            title: $slots->count() > 1
                ? __(':sport · :count slots', ['sport' => $sport, 'count' => $slots->count()])
                : $sport.' · '.($first->resource?->name ?? __('Court')),
            note: __('Your booking is confirmed. Show this receipt at the front desk when you arrive — no further action needed.'),
            items: array_values($slots->map(fn (ResourceBooking $slot): array => [
                'label' => $slot->resource?->name ?? __('Court'),
                'starts_at' => $slot->starts_at->toIso8601String(),
                'ends_at' => $slot->ends_at->toIso8601String(),
                'players' => null,
                'amount' => round((float) $slot->amount, 2),
            ])->all()),
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function registrationReceipt(OpenPlayRegistration $registration, Payment $payment): array
    {
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
     * @param  list<ReceiptItem>  $items
     * @return array<string, mixed>
     */
    private function receipt(Payment $payment, ?User $customer, string $title, string $note, array $items): array
    {
        $customer ??= $payment->user;
        $total = round((float) $payment->amount, 2);
        $fee = round((float) $payment->convenience_fee, 2);
        // A payment for a spot that was already paid for, or whose hold was
        // released, is flagged for a refund. Its receipt must say so rather
        // than read as a confirmed booking.
        $refundDue = $payment->flagged_at !== null;

        $receipt = [
            'reference' => $payment->invoice_number,
            'venue' => $this->venue(),
            'title' => $title,
            'status' => $refundDue ? __('PAID · REFUND DUE') : __('PAID · CONFIRMED'),
            'note' => $refundDue
                ? __('We received this payment after your spot was already paid for or released, so it will be refunded to you. Contact us if you have any questions.')
                : $note,
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
            'refund_due' => $refundDue,
            // Front-desk staff scan this to open the live payment record, so a
            // doctored screenshot can't pass for a real receipt.
            'verify_url' => route('payments.show', $payment),
        ];

        return [...$receipt, 'lines' => $this->lines($receipt)];
    }

    /**
     * The receipt as the printer prints it, top to bottom. The checkout page
     * draws the paper and the saved image from these, and the email renders
     * the same list, so no copy can drift from another.
     *
     * @param  array{reference: string, venue: array{name: string, address: string|null}, title: string, status: string, note: string, customer: array{name: string|null, phone: string|null}, items: list<ReceiptItem>, subtotal: float, fee: float, total: float, method: string, paid_at: string, verify_url: string}  $receipt
     * @return list<ReceiptLine>
     */
    private function lines(array $receipt): array
    {
        $lines = [['kind' => 'heading', 'text' => Str::upper($receipt['venue']['name'])]];

        if ($receipt['venue']['address'] !== null) {
            $lines[] = ['kind' => 'center', 'text' => $receipt['venue']['address'], 'muted' => true];
        }

        array_push(
            $lines,
            ['kind' => 'center', 'text' => __('ACKNOWLEDGEMENT RECEIPT'), 'spaced' => true],
            ['kind' => 'rule'],
            ['kind' => 'caption', 'text' => __('REFERENCE')],
            ['kind' => 'reference', 'text' => $receipt['reference']],
            ['kind' => 'status', 'text' => $receipt['status']],
            ['kind' => 'text', 'text' => $receipt['title'], 'strong' => true],
        );

        $when = $this->scheduleSummary($receipt['items']);

        if ($when !== null) {
            $lines[] = ['kind' => 'text', 'text' => $when];
        }

        $lines[] = ['kind' => 'rule'];
        $lines[] = ['kind' => 'row', 'label' => __('Guest'), 'value' => $receipt['customer']['name'] ?? '—'];

        if (filled($receipt['customer']['phone'])) {
            $lines[] = ['kind' => 'row', 'label' => __('Mobile'), 'value' => $receipt['customer']['phone']];
        }

        $lines[] = ['kind' => 'row', 'label' => __('Payment'), 'value' => $receipt['method']];
        $lines[] = ['kind' => 'rule'];

        foreach ($receipt['items'] as $item) {
            $lines[] = ['kind' => 'row', 'label' => $item['label'], 'value' => $this->money($item['amount'])];

            $detail = $this->itemDetail($item);

            if ($detail !== null) {
                $lines[] = ['kind' => 'text', 'text' => $detail, 'muted' => true, 'indent' => true];
            }
        }

        // Only spelled out when there is a fee, so the total visibly adds up.
        if ($receipt['fee'] > 0) {
            $lines[] = ['kind' => 'row', 'label' => __('Subtotal'), 'value' => $this->money($receipt['subtotal'])];
            $lines[] = ['kind' => 'row', 'label' => __('Convenience fee'), 'value' => $this->money($receipt['fee'])];
        }

        array_push(
            $lines,
            ['kind' => 'row', 'label' => __('TOTAL'), 'value' => $this->money($receipt['total']), 'strong' => true],
            ['kind' => 'row', 'label' => __('Amount paid'), 'value' => $this->money($receipt['total'])],
            ['kind' => 'rule'],
            ['kind' => 'note', 'text' => $receipt['note']],
            ['kind' => 'rule'],
            ['kind' => 'qr', 'value' => $receipt['verify_url'], 'caption' => __('SCAN TO VERIFY')],
            [
                'kind' => 'center',
                'text' => __('Issued :date', ['date' => Carbon::parse($receipt['paid_at'])->format('D, M j, Y · g:i A')]),
                'muted' => true,
            ],
            ['kind' => 'center', 'text' => __('SALAMAT PO · THANK YOU'), 'spaced' => true],
        );

        return $lines;
    }

    /**
     * The one-line "when" under the title: exact for one slot, a date span
     * for several.
     *
     * @param  list<ReceiptItem>  $items
     */
    private function scheduleSummary(array $items): ?string
    {
        $timed = array_values(array_filter($items, fn (array $item): bool => $item['starts_at'] !== null));

        if ($timed === []) {
            return null;
        }

        $first = $timed[0];
        $start = Carbon::parse($first['starts_at']);

        if (count($timed) === 1) {
            return $start->format('D, M j, Y').' · '.$this->timeRange($start, $first['ends_at']);
        }

        $end = Carbon::parse($timed[count($timed) - 1]['starts_at']);

        return $start->isSameDay($end)
            ? $start->format('D, M j, Y')
            : $start->format('M j').' – '.$end->format('M j, Y');
    }

    /**
     * @param  ReceiptItem  $item
     */
    private function itemDetail(array $item): ?string
    {
        if ($item['starts_at'] === null) {
            return null;
        }

        $start = Carbon::parse($item['starts_at']);
        $parts = [$start->format('D, M j'), $this->timeRange($start, $item['ends_at'])];
        $quantity = $item['players'] !== null
            ? $item['players'].' '.($item['players'] === 1 ? __('player') : __('players'))
            : $this->duration($start, $item['ends_at']);

        if ($quantity !== null) {
            $parts[] = $quantity;
        }

        return implode(' · ', $parts);
    }

    private function timeRange(Carbon $start, ?string $endsAt): string
    {
        return $endsAt === null
            ? $this->clock($start)
            : $this->clock($start).'–'.$this->clock(Carbon::parse($endsAt));
    }

    /** "6 PM", or "6:30 PM" when the minutes matter. */
    private function clock(Carbon $time): string
    {
        return $time->format($time->minute === 0 ? 'g A' : 'g:i A');
    }

    private function duration(Carbon $start, ?string $endsAt): ?string
    {
        if ($endsAt === null) {
            return null;
        }

        $hours = $start->diffInMinutes(Carbon::parse($endsAt)) / 60;

        if ($hours <= 0) {
            return null;
        }

        return (floor($hours) === $hours ? (string) (int) $hours : number_format($hours, 1)).' hr';
    }

    private function money(float $amount): string
    {
        return '₱'.number_format($amount, 2);
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
