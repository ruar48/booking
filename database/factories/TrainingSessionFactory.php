<?php

namespace Database\Factories;

use App\Models\Coach;
use App\Models\Resource;
use App\Models\TrainingSession;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TrainingSession>
 */
class TrainingSessionFactory extends Factory
{
    protected $model = TrainingSession::class;

    public function definition(): array
    {
        return [
            'coach_id' => Coach::factory(),
            'court_id' => Resource::factory(),
            'title' => fake()->words(3, true).' Training',
            'description' => fake()->paragraph(),
            'scheduled_at' => fake()->dateTimeBetween('+1 day', '+30 days'),
            'duration_minutes' => fake()->randomElement([60, 90, 120]),
            'notes' => fake()->optional()->sentence(),
            'coach_feedback' => null,
            'status' => 'scheduled',
        ];
    }
}
