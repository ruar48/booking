<?php

namespace Database\Factories;

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Models\Court;
use App\Models\CourtBooking;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CourtBooking>
 */
class CourtBookingFactory extends Factory
{
    protected $model = CourtBooking::class;

    public function definition(): array
    {
        $startsAt = fake()->dateTimeBetween('+1 day', '+30 days');

        return [
            'court_id' => Court::factory(),
            'user_id' => User::factory(),
            'approved_by' => null,
            'starts_at' => $startsAt,
            'ends_at' => (clone $startsAt)->modify('+1 hour'),
            'status' => BookingStatus::Approved,
            'payment_status' => PaymentStatus::Unpaid,
            'amount' => fake()->randomFloat(2, 20, 150),
            'notes' => fake()->optional()->sentence(),
            'cancellation_reason' => null,
        ];
    }
}
