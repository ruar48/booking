<?php

namespace App\Services\Booking;

use App\Enums\PaymentStatus;
use App\Models\Policy;
use App\Models\ResourceBooking;
use App\Models\Setting;
use App\Models\User;

/**
 * Builds the props the booking detail and checkout screens render from.
 *
 * Kept out of the controller because it derives values (group totals, the
 * payment deadline) and reaches into policies and settings — none of which is
 * request/response coordination.
 */
class BookingPresenter
{
    /**
     * @return array<string, mixed>
     */
    public function showProps(ResourceBooking $booking, User $viewer): array
    {
        $booking->load(['resource', 'user', 'approver']);

        // Siblings from the same bulk submission, so checkout can show and
        // charge the whole group instead of this one row. Null when the
        // booking wasn't part of a multi-slot submission.
        $groupBookings = $booking->groupBookings()->load('resource');
        $isGrouped = $groupBookings->count() > 1;

        return [
            'booking' => $booking,
            'canManage' => $viewer->isVenueAdmin(),
            'canReschedule' => $viewer->can('reschedule', $booking),
            'canCancel' => $viewer->can('cancel', $booking),
            'policies' => $this->checkoutPolicies(),
            'groupBookings' => $isGrouped ? $groupBookings->values() : null,
            'groupTotalAmount' => $isGrouped ? round((float) $groupBookings->sum('amount'), 2) : null,
            'paymentDeadline' => $this->paymentDeadline($booking),
        ];
    }

    /**
     * When an unpaid booking is auto-cancelled and its slot released. Null once
     * paid, or when the venue hasn't configured a window.
     */
    public function paymentDeadline(ResourceBooking $booking): ?string
    {
        if ($booking->payment_status !== PaymentStatus::Unpaid) {
            return null;
        }

        $minutes = Setting::query()
            ->where('group', 'bookings')
            ->where('key', 'unpaid_cancel_minutes')
            ->value('value');

        if (! $minutes) {
            return null;
        }

        return $booking->created_at->addMinutes((int) $minutes)->toIso8601String();
    }

    /**
     * Attaches this viewer's answers for one booking.
     *
     * Both rules are per-booking rather than per-status — rescheduling has a
     * 2-day cutoff and a once-only limit, and cancelling depends on whether the
     * booking is still unpaid — so a list cannot infer either from status
     * alone without duplicating the policy in the frontend.
     */
    public function withPermissionFlags(ResourceBooking $booking, User $viewer): ResourceBooking
    {
        return $booking
            ->setAttribute('can_reschedule', $viewer->can('reschedule', $booking))
            ->setAttribute('can_cancel', $viewer->can('cancel', $booking));
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function checkoutPolicies(): array
    {
        return Policy::query()
            ->where('placement', 'checkout')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('title')
            ->get(['id', 'title', 'body'])
            ->all();
    }
}
