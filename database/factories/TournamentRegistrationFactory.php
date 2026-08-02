<?php

namespace Database\Factories;

use App\Enums\PaymentStatus;
use App\Models\Player;
use App\Models\Tournament;
use App\Models\TournamentCategory;
use App\Models\TournamentRegistration;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TournamentRegistration>
 */
class TournamentRegistrationFactory extends Factory
{
    protected $model = TournamentRegistration::class;

    public function definition(): array
    {
        return [
            'tournament_id' => Tournament::factory(),
            'tournament_category_id' => TournamentCategory::factory(),
            'player_id' => Player::factory(),
            'payment_status' => PaymentStatus::Unpaid,
            'seed' => null,
        ];
    }
}
