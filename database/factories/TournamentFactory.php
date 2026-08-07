<?php

namespace Database\Factories;

use App\Enums\TournamentFormat;
use App\Enums\TournamentStatus;
use App\Models\Tournament;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Tournament>
 */
class TournamentFactory extends Factory
{
    protected $model = Tournament::class;

    public function definition(): array
    {
        $name = fake()->words(3, true).' Open';

        return [
            'created_by' => User::factory(),
            'name' => $name,
            'slug' => Str::slug($name).'-'.fake()->unique()->numerify('###'),
            'description' => fake()->paragraph(),
            'poster' => null,
            'entry_fee' => fake()->randomFloat(2, 0, 100),
            'max_players' => fake()->randomElement([8, 16, 32, 64]),
            'format' => TournamentFormat::SingleElimination,
            'status' => TournamentStatus::Draft,
            'registration_opens_at' => now()->addDays(7),
            'registration_closes_at' => now()->addDays(21),
            'starts_at' => now()->addDays(30),
            'ends_at' => now()->addDays(33),
            'champion_id' => null,
        ];
    }
}
