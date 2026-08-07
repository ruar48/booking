<?php

namespace Database\Factories;

use App\Enums\ResourceStatus;
use App\Enums\Sport;
use App\Models\Resource;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Resource>
 */
class ResourceFactory extends Factory
{
    protected $model = Resource::class;

    public function definition(): array
    {
        return [
            'sport' => Sport::Pickleball,
            'name' => 'Court '.fake()->numberBetween(1, 20),
            'resource_number' => (string) fake()->numberBetween(1, 20),
            'surface_type' => fake()->randomElement(['hard', 'acrylic', 'cushioned', 'sport']),
            'location_type' => fake()->randomElement(['indoor', 'outdoor']),
            'has_lighting' => fake()->boolean(),
            'hourly_rate' => fake()->randomFloat(2, 10, 100),
            'status' => ResourceStatus::Available,
            'photos' => null,
            'description' => fake()->optional()->sentence(),
            'metadata' => null,
        ];
    }
}
