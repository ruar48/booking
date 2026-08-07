<?php

namespace Database\Factories;

use App\Models\OpenPlaySession;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OpenPlaySession>
 */
class OpenPlaySessionFactory extends Factory
{
    protected $model = OpenPlaySession::class;

    public function definition(): array
    {
        $startsAt = fake()->dateTimeBetween('+1 day', '+60 days');

        return [
            'title' => fake()->words(4, true),
            'description' => fake()->paragraph(),
            'starts_at' => $startsAt,
            'ends_at' => (clone $startsAt)->modify('+2 hours'),
            'location' => fake()->optional()->address(),
        ];
    }
}
