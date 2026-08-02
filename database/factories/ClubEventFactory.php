<?php

namespace Database\Factories;

use App\Models\Club;
use App\Models\ClubEvent;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ClubEvent>
 */
class ClubEventFactory extends Factory
{
    protected $model = ClubEvent::class;

    public function definition(): array
    {
        $startsAt = fake()->dateTimeBetween('+1 day', '+60 days');

        return [
            'club_id' => Club::factory(),
            'title' => fake()->words(4, true),
            'description' => fake()->paragraph(),
            'starts_at' => $startsAt,
            'ends_at' => (clone $startsAt)->modify('+2 hours'),
            'location' => fake()->optional()->address(),
        ];
    }
}
