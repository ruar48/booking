<?php

use App\Enums\RentalItemStatus;
use App\Enums\ResourceStatus;
use App\Enums\Sport;
use App\Models\RentalItem;
use App\Models\Resource;
use App\Services\HomePageService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

/**
 * The home page's rates card: read from the courts and rental items
 * themselves, so it can't quote a price checkout won't charge.
 */
uses(RefreshDatabase::class);

beforeEach(fn () => HomePageService::forget());

function ratesRentalItem(string $name, float $rate, ?float $hourlyRate = null, RentalItemStatus $status = RentalItemStatus::Active): void
{
    RentalItem::query()->create([
        'name' => $name,
        'sku' => fake()->unique()->bothify('RNT-####'),
        'category' => 'equipment',
        'rate' => $rate,
        'hourly_rate' => $hourlyRate,
        'total_quantity' => 5,
        'available_quantity' => 5,
        'status' => $status,
    ]);
}

it('shows what bookable courts charge by day and evening, and the cheapest paddle rental', function () {
    Resource::factory()->count(2)->create(['sport' => Sport::Pickleball, 'hourly_rate' => 200, 'evening_rate' => 250]);
    // Under maintenance, so its rate isn't advertised.
    Resource::factory()->create(['sport' => Sport::Pickleball, 'hourly_rate' => 90, 'status' => ResourceStatus::Maintenance]);
    Resource::factory()->create(['sport' => Sport::Billiards, 'hourly_rate' => 15]);

    ratesRentalItem('Pickleball Paddle - Rental', 100);
    ratesRentalItem('Pickleball Paddle - Pro Rental', 180);
    ratesRentalItem('Pickleball Balls (Set of 3)', 50);
    ratesRentalItem('Old paddle', 20, status: RentalItemStatus::Inactive);

    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('welcome')
            ->where('rates.eveningFrom', '6 PM')
            ->where('rates.sports', [
                ['sport' => 'pickleball', 'label' => 'Pickleball', 'unit' => 'courts', 'day' => 200, 'evening' => 250, 'varies' => false],
                ['sport' => 'billiards', 'label' => 'Billiard', 'unit' => 'tables', 'day' => 15, 'evening' => null, 'varies' => false],
            ])
            ->where('rates.paddleRental', ['amount' => 100, 'per' => 'day', 'from' => true]));
});

it('quotes "from" prices when courts differ, and the hourly paddle rate when there is one', function () {
    Resource::factory()->create(['sport' => Sport::Pickleball, 'hourly_rate' => 200, 'evening_rate' => 250]);
    // No evening rate: this court charges 300 all day.
    Resource::factory()->create(['sport' => Sport::Pickleball, 'hourly_rate' => 300, 'evening_rate' => null]);
    ratesRentalItem('Paddle', 100, hourlyRate: 30);

    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('rates.sports.0.day', 200)
            ->where('rates.sports.0.evening', 250)
            ->where('rates.sports.0.varies', true)
            ->where('rates.paddleRental', ['amount' => 30, 'per' => 'hour', 'from' => false]));
});
