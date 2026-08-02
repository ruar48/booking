<?php

namespace Database\Factories;

use App\Enums\CourtStatus;
use App\Models\Club;
use App\Models\Court;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Court>
 */
class CourtFactory extends Factory
{
    protected $model = Court::class;

    public function definition(): array
    {
        return [
            'club_id' => Club::factory(),
            'name' => 'Court '.fake()->numberBetween(1, 20),
            'court_number' => (string) fake()->numberBetween(1, 20),
            'surface_type' => fake()->randomElement(['hard', 'acrylic', 'cushioned', 'sport']),
            'location_type' => fake()->randomElement(['indoor', 'outdoor']),
            'has_lighting' => fake()->boolean(),
            'hourly_rate' => fake()->randomFloat(2, 10, 100),
            'status' => CourtStatus::Available,
            'photos' => null,
            'description' => fake()->optional()->sentence(),
        ];
    }
}
