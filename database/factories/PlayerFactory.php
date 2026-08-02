<?php

namespace Database\Factories;

use App\Models\Club;
use App\Models\Player;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Player>
 */
class PlayerFactory extends Factory
{
    protected $model = Player::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'club_id' => Club::factory(),
            'skill_rating' => fake()->numberBetween(800, 2000),
            'experience_level' => fake()->randomElement(['beginner', 'intermediate', 'advanced', 'professional']),
            'playing_hand' => fake()->randomElement(['right', 'left', 'ambidextrous']),
            'gender' => fake()->randomElement(['male', 'female', 'other']),
            'birthdate' => fake()->date(),
            'phone' => fake()->phoneNumber(),
            'address' => fake()->address(),
            'emergency_contact_name' => fake()->name(),
            'emergency_contact_phone' => fake()->phoneNumber(),
            'bio' => fake()->optional()->paragraph(),
            'is_active' => true,
        ];
    }
}
