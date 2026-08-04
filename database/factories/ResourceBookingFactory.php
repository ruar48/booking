<?php

namespace Database\Factories;

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Models\Resource;
use App\Models\ResourceBooking;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ResourceBooking>
 */
class ResourceBookingFactory extends Factory
{
    protected $model = ResourceBooking::class;

    public function definition(): array
    {
        $startsAt = fake()->dateTimeBetween('+1 day', '+30 days');

        return [
            'resource_id' => Resource::factory(),
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
