<?php

namespace Database\Factories;

use App\Enums\SaleStatus;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Sale>
 */
class SaleFactory extends Factory
{
    protected $model = Sale::class;

    public function definition(): array
    {
        $subtotal = fake()->randomFloat(2, 5, 300);
        $discount = 0;
        $tax = 0;

        return [
            'cashier_id' => User::factory(),
            'customer_id' => null,
            'invoice_number' => 'SALE-'.Str::upper(Str::random(10)),
            'subtotal' => $subtotal,
            'discount' => $discount,
            'tax' => $tax,
            'total' => $subtotal - $discount + $tax,
            'status' => SaleStatus::Completed,
            'notes' => fake()->optional()->sentence(),
        ];
    }
}
