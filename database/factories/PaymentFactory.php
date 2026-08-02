<?php

namespace Database\Factories;

use App\Enums\PaymentStatus;
use App\Models\CourtBooking;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Payment>
 */
class PaymentFactory extends Factory
{
    protected $model = Payment::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'payable_type' => CourtBooking::class,
            'payable_id' => CourtBooking::factory(),
            'invoice_number' => 'INV-'.Str::upper(Str::random(10)),
            'amount' => fake()->randomFloat(2, 10, 500),
            'currency' => 'USD',
            'status' => PaymentStatus::Pending,
            'payment_method' => fake()->randomElement(['card', 'cash', 'bank_transfer']),
            'paid_at' => null,
            'notes' => fake()->optional()->sentence(),
        ];
    }
}
