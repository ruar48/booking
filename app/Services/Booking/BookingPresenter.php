<?php

namespace App\Services\Booking;

use App\Actions\Booking\ReleaseUnpaidBookings;
use App\Enums\PaymentStatus;
use App\Models\Policy;
use App\Models\ResourceBooking;
use App\Models\Setting;
use App\Models\User;
use App\Support\ConvenienceFee;

/**
 * Builds the props the booking detail and checkout screens render from.
 *
 * Kept out of the controller because it derives values (group totals, the
 * payment deadline) and reaches into policies and settings — none of which is
 * request/response coordination.
 */
class BookingPresenter
{
    public function __construct(
        private readonly ReleaseUnpaidBookings $releaseUnpaid,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function showProps(ResourceBooking $booking, User $viewer): array
    {
        // A booking past its window should show as cancelled, not "0:00 left",
        // even if the scheduler isn't running.
        if ($booking->payment_status === PaymentStatus::Unpaid) {
            $this->releaseUnpaid->executeThrottled();
            $booking->refresh();
        }

        $booking->load(['resource', 'user', 'approver:id,name']);

        // Siblings from the same bulk submission, so checkout can show and
        // charge the whole group instead of this one row. Null when the
        // booking wasn't part of a multi-slot submission.
        $groupBookings = $booking->groupBookings()->load('resource');
        $isGrouped = $groupBookings->count() > 1;

        return [
            'booking' => $booking,
            'canManage' => $viewer->isVenueAdmin(),
            'policies' => $this->checkoutPolicies(),
            'groupBookings' => $isGrouped ? $groupBookings->values() : null,
            'groupTotalAmount' => $isGrouped ? round((float) $groupBookings->sum('amount'), 2) : null,
            'fee' => ConvenienceFee::for($isGrouped ? $groupBookings->sum('amount') : $booking->amount),
            'paymentDeadline' => $this->paymentDeadline($booking),
            'venue' => $this->venueProfile(),
        ];
    }

    /**
     * The venue profile, for the location card and its directions map.
     *
     * @return array<string, mixed>
     */
    private function venueProfile(): array
    {
        return Setting::query()
            ->where('group', 'venue')
            ->where('key', 'profile')
            ->value('value') ?? [];
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
