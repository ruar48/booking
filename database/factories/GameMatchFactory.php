<?php

namespace Database\Factories;

use App\Enums\MatchStatus;
use App\Models\Court;
use App\Models\GameMatch;
use App\Models\Player;
use App\Models\Tournament;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<GameMatch>
 */
class GameMatchFactory extends Factory
{
    protected $model = GameMatch::class;

    public function definition(): array
    {
        return [
            'tournament_id' => Tournament::factory(),
            'court_id' => Court::factory(),
            'player1_id' => Player::factory(),
            'player2_id' => Player::factory(),
            'winner_id' => null,
            'referee_id' => null,
            'round' => 1,
            'match_number' => fake()->numberBetween(1, 32),
            'bracket_position' => fake()->optional()->numberBetween(1, 32),
            'status' => MatchStatus::Scheduled,
            'result_type' => null,
            'scheduled_at' => fake()->dateTimeBetween('+1 day', '+30 days'),
            'started_at' => null,
            'completed_at' => null,
        ];
    }
}
