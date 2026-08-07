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
            'user_id' => User::factory(),
            'certifications' => [fake()->words(2, true).' Certification'],
            'years_experience' => fake()->numberBetween(1, 30),
            'bio' => fake()->paragraph(),
            'availability' => null,
            'is_active' => true,
        ];
    }
}
