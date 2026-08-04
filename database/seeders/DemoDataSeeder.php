<?php

namespace Database\Seeders;

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Enums\Role as RoleEnum;
use App\Enums\Sport;
use App\Models\Announcement;
use App\Models\Club;
use App\Models\ClubEvent;
use App\Models\Player;
use App\Models\Resource;
use App\Models\ResourceBooking;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $password = Hash::make('password');

        $owner = User::factory()->create([
            'name' => 'Court Owner',
            'email' => 'owner@galaangramos.test',
            'password' => $password,
        ]);
        $owner->assignRole(RoleEnum::SuperAdmin);

        $club = Club::factory()->create([
            'name' => 'Galaang-Ramos Pickleball',
            'slug' => 'galaang-ramos-pickleball',
            'email' => 'owner@galaangramos.test',
            'phone' => '+1 (555) 010-2026',
            'address_line_1' => '123 Court Lane',
            'city' => 'Ramos',
            'state' => 'Pangasinan',
            'postal_code' => '2411',
            'country' => 'PH',
            'description' => 'Welcome to Galaang-Ramos Pickleball — your neighborhood spot for open play and court reservations. We run two indoor acrylic courts with lighting, perfect for beginners and competitive players alike. Book Court 1 or Court 2 online anytime.',
            'operating_hours' => [
                'monday' => ['open' => '07:00', 'close' => '23:00'],
                'tuesday' => ['open' => '07:00', 'close' => '23:00'],
                'wednesday' => ['open' => '07:00', 'close' => '23:00'],
                'thursday' => ['open' => '07:00', 'close' => '23:00'],
                'friday' => ['open' => '07:00', 'close' => '23:00'],
                'saturday' => ['open' => '07:00', 'close' => '23:00'],
                'sunday' => ['open' => '07:00', 'close' => '23:00'],
            ],
            'amenities' => [
                'Parking',
                'Comfort rooms',
                'Changing areas',
                'Water station',
                'Court lighting',
            ],
            'gallery' => [],
        ]);

        $club->users()->attach($owner->id, [
            'membership_status' => 'active',
            'joined_at' => now()->subYear()->toDateString(),
        ]);

        $courts = Resource::factory()
            ->count(2)
            ->sequence(
                ['name' => 'Court 1', 'resource_number' => '1', 'surface_type' => 'acrylic', 'has_lighting' => true, 'hourly_rate' => 25],
                ['name' => 'Court 2', 'resource_number' => '2', 'surface_type' => 'acrylic', 'has_lighting' => true, 'hourly_rate' => 25],
            )
            ->create(['club_id' => $club->id, 'sport' => Sport::Pickleball]);

        $members = collect();

        foreach (range(1, 4) as $index) {
            $member = User::factory()->create([
                'name' => fake()->name(),
                'email' => "member{$index}@galaangramos.test",
                'password' => $password,
            ]);
            $member->assignRole(RoleEnum::Player);
            $club->users()->attach($member->id, [
                'membership_status' => 'active',
                'joined_at' => now()->subWeeks(fake()->numberBetween(4, 20))->toDateString(),
            ]);

            $members->push(Player::factory()->create([
                'user_id' => $member->id,
                'club_id' => $club->id,
            ]));
        }

        foreach ($members->take(3) as $index => $player) {
            ResourceBooking::factory()->create([
                'resource_id' => $courts[$index % 2]->id,
                'user_id' => $player->user_id,
                'approved_by' => $owner->id,
                'starts_at' => now()->addDays($index + 1)->setTime(9 + $index, 0),
                'ends_at' => now()->addDays($index + 1)->setTime(10 + $index, 0),
                'status' => BookingStatus::Approved,
                'payment_status' => PaymentStatus::Paid,
                'amount' => 25,
            ]);
        }

        ResourceBooking::factory()->create([
            'resource_id' => $courts->first()->id,
            'user_id' => $members->first()->user_id,
            'starts_at' => now()->addDays(2)->setTime(14, 0),
            'ends_at' => now()->addDays(2)->setTime(15, 0),
            'status' => BookingStatus::Approved,
            'payment_status' => PaymentStatus::Unpaid,
            'amount' => 25,
        ]);

        Announcement::factory()->published()->create([
            'club_id' => $club->id,
            'created_by' => $owner->id,
            'title' => 'Welcome to our courts',
            'content' => 'Book Court 1 or Court 2 online anytime. Peak hours are 5–8 PM on weekdays — reserve early!',
            'show_on_dashboard' => true,
            'show_on_home' => true,
            'show_on_player_portal' => true,
        ]);

        $openPlayDates = [
            now()->next('Friday')->setTime(18, 0),
            now()->next('Saturday')->setTime(18, 0),
            now()->addWeek()->next('Friday')->setTime(18, 0),
        ];

        foreach ($openPlayDates as $index => $startsAt) {
            ClubEvent::factory()->create([
                'club_id' => $club->id,
                'title' => $index % 2 === 0 ? 'Friday Open Play' : 'Saturday Smash Session',
                'description' => 'Drop-in open play for all skill levels. Paddles available on request.',
                'starts_at' => $startsAt,
                'ends_at' => (clone $startsAt)->addHours(5),
                'location' => 'Courts 1, 2',
                'price_per_player' => 10,
                'max_players' => 16,
                'skill_level' => 'all_levels',
            ]);
        }
    }
}
