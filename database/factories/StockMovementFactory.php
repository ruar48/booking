<?php

namespace Database\Factories;

use App\Enums\StockMovementType;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StockMovement>
 */
class StockMovementFactory extends Factory
{
    protected $model = StockMovement::class;

    public function definition(): array
    {
        $quantityChange = fake()->numberBetween(-20, 50);

        return [
            'product_id' => Product::factory(),
            'user_id' => User::factory(),
            'type' => fake()->randomElement(StockMovementType::cases()),
            'quantity_change' => $quantityChange,
            'quantity_after' => max(0, $quantityChange),
            'reason' => fake()->optional()->sentence(),
        ];
    }
}
