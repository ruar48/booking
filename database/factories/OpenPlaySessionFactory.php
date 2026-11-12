<?php

namespace Database\Factories;

use App\Enums\OpenPlayFormat;
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

    /** A paddle-stacking session (the default column value is a bracket). */
    public function paddleStacking(): static
    {
        return $this->state(fn (): array => [
            'format' => OpenPlayFormat::PaddleStacking,
            'bracket_format' => null,
        ]);
    }
}
