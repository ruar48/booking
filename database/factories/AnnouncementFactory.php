<?php

namespace Database\Factories;

use App\Models\Announcement;
use App\Models\Club;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Announcement>
 */
class AnnouncementFactory extends Factory
{
    protected $model = Announcement::class;

    public function definition(): array
    {
        return [
            'club_id' => Club::factory(),
            'created_by' => User::factory(),
            'title' => fake()->sentence(4),
            'content' => fake()->paragraphs(2, true),
            'show_on_dashboard' => true,
            'show_on_home' => false,
            'show_on_player_portal' => true,
            'is_published' => false,
            'published_at' => null,
        ];
    }

    public function published(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_published' => true,
            'published_at' => now(),
        ]);
    }
}
