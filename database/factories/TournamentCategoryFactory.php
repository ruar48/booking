<?php

namespace Database\Factories;

use App\Models\Tournament;
use App\Models\TournamentCategory;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TournamentCategory>
 */
class TournamentCategoryFactory extends Factory
{
    protected $model = TournamentCategory::class;

    public function definition(): array
    {
        return [
            'tournament_id' => Tournament::factory(),
            'name' => fake()->randomElement(['Men\'s Singles', 'Women\'s Singles', 'Mixed Doubles']),
            'gender' => fake()->randomElement(['male', 'female', 'mixed']),
            'age_group' => fake()->randomElement(['open', 'u18', 'u16', 'senior']),
            'max_participants' => fake()->randomElement([8, 16, 32]),
        ];
    }
}
