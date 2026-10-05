<?php

namespace App\Actions\Booking;

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Models\Resource;
use App\Models\ResourceBooking;
use App\Services\Booking\BookingPricer;
use App\Services\ResourceBookingService;
use Illuminate\Support\Carbon;

/**
 * Creates one booking, pricing it from the resource's day/evening rates.
 *
 * Pricing lives here rather than in the controller so every entry point —
 * self-service, bulk and walk-in — charges identically.
 */
class CreateBooking
{
    public function __construct(
        private readonly ResourceBookingService $bookingService,
        private readonly BookingPricer $pricer,
    ) {}

    /**
     * @param  array<string, mixed>  $data  Validated resource_id/starts_at/ends_at (+ optional notes).
     * @param  array<string, mixed>  $overrides  Per-caller attributes, e.g. a walk-in's Approved status.
     *
     * @throws \App\Exceptions\BookingConflictException
     */
    public function execute(
        array $data,
        int $userId,
        ?string $bookingGroupId = null,
        array $overrides = [],
    ): ResourceBooking {
        return $this->bookingService->create([
            ...$data,
            'user_id' => $userId,
            'booking_group_id' => $bookingGroupId,
            'status' => BookingStatus::Pending,
            'payment_status' => PaymentStatus::Unpaid,
            'amount' => $this->priceFor($data),
            ...$overrides,
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function priceFor(array $data): float
    {
        return $this->pricer->price(
            Resource::query()->findOrFail($data['resource_id']),
            Carbon::parse($data['starts_at']),
            Carbon::parse($data['ends_at']),
        );
    }
}
