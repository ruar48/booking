<?php

namespace App\Actions\Booking;

use App\Actions\CreateWalkInCustomer;
use App\Contracts\Repositories\ResourceBookingRepositoryInterface;
use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Books courts for a customer standing at the counter.
 *
 * Walk-ins are confirmed in person by staff, so they skip the self-service
 * checkout window and are Approved immediately. Customer creation and every
 * booking share one transaction — a mid-way conflict must not leave a
 * half-registered customer behind.
 */
class CreateWalkInBookings
{
    public function __construct(
        private readonly CreateBooking $createBooking,
        private readonly CreateWalkInCustomer $createWalkInCustomer,
        private readonly ResourceBookingRepositoryInterface $bookingRepository,
    ) {}

    /**
     * @param  array<string, mixed>  $customer  Validated: mode=existing|new (+ user_id, or name/phone).
     * @param  array<int, array<string, mixed>>  $bookings
     * @return int Bookings created.
     *
     * @throws \App\Exceptions\BookingConflictException
     */
    public function execute(array $customer, array $bookings, bool $markPaid, User $staff): int
    {
        return DB::transaction(function () use ($customer, $bookings, $markPaid, $staff): int {
            $customerId = $customer['mode'] === 'existing'
                ? (int) $customer['user_id']
                : $this->createWalkInCustomer->create($customer['name'], $customer['phone'])->id;

            foreach ($bookings as $data) {
                $booking = $this->createBooking->execute($data, $customerId, null, [
                    'created_by' => $staff->id,
                    'status' => BookingStatus::Approved,
                ]);

                if ($markPaid) {
                    $this->bookingRepository->update($booking, [
                        'payment_status' => PaymentStatus::Paid,
                    ]);
                }
            }

            return count($bookings);
        });
    }
}
