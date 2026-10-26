<?php

namespace Database\Factories;

use App\Models\Coach;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Coach>
 */
class CoachFactory extends Factory
{
    protected $model = Coach::class;

    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'certifications' => [fake()->words(2, true).' Certification'],
            'years_experience' => fake()->numberBetween(1, 30),
            'bio' => fake()->paragraph(),
            'specialties' => ['Beginners'],
            'rate_per_hour' => 500,
            'availability' => null,
            'is_active' => true,
        ];
    }

    public function withAccount(): static
    {
        return $this->state(fn (): array => ['user_id' => User::factory()]);
    }

    public function inactive(): static
    {
        return $this->state(fn (): array => ['is_active' => false]);
    }
}
