<?php

namespace Database\Factories;

use App\Enums\ProductStatus;
use App\Models\Club;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        $price = fake()->randomFloat(2, 2, 100);

        return [
            'club_id' => Club::factory(),
            'name' => fake()->words(3, true),
            'sku' => strtoupper(fake()->unique()->bothify('SKU-####??')),
            'category' => fake()->randomElement(['equipment', 'apparel', 'drinks', 'snacks', 'accessories']),
            'price' => $price,
            'cost' => round($price * 0.6, 2),
            'stock_quantity' => fake()->numberBetween(0, 200),
            'low_stock_threshold' => fake()->numberBetween(3, 10),
            'status' => ProductStatus::Active,
            'photos' => null,
            'description' => fake()->optional()->sentence(),
        ];
    }
}
