<?php

use App\Enums\ResourceStatus;
use App\Models\DateOverride;
use App\Models\OpenPlaySession;
use App\Models\Resource;
use App\Models\ResourceBooking;
use App\Services\HomePageService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

it('counts only open play sessions in the current week', function () {
    // A Wednesday, so the week has room on both sides.
    Carbon::setTestNow(Carbon::parse('2026-10-21 10:00:00'));
    HomePageService::forget();

    $session = fn (string $startsAt) => OpenPlaySession::factory()->create([
        'starts_at' => $startsAt,
        'ends_at' => Carbon::parse($startsAt)->addHours(2),
    ]);

    $session('2026-10-19 08:00:00'); // Monday, this week
    $session('2026-10-24 18:00:00'); // Saturday, this week
    $session('2026-10-25 18:00:00'); // Sunday, this week
    $session('2026-10-27 18:00:00'); // next week
    $session('2026-10-15 18:00:00'); // last week

    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('welcome')
            ->where('stats.open_play_this_week', 3));
});

it('counts the hourly slots still bookable today', function () {
    Carbon::setTestNow(Carbon::parse('2026-10-21 10:30:00'));
    HomePageService::forget();

    DateOverride::query()->create([
        'date' => '2026-10-21',
        'is_closed' => false,
        'open_time' => '08:00',
        'close_time' => '14:00',
    ]);

    $court = Resource::factory()->create(['status' => ResourceStatus::Available]);
    Resource::factory()->create(['status' => ResourceStatus::Maintenance]);

    // 08:00–14:00 is six slots; 08–10 and 10–11 have started, leaving 11, 12, 13.
    ResourceBooking::factory()->create([
        'resource_id' => $court->id,
        'starts_at' => '2026-10-21 12:00:00',
        'ends_at' => '2026-10-21 13:00:00',
    ]);

    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('stats.available_slots_today', 2));
});

it('reports no available slots on a closed day', function () {
    Carbon::setTestNow(Carbon::parse('2026-10-21 07:00:00'));
    HomePageService::forget();

    Resource::factory()->create(['status' => ResourceStatus::Available]);

    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('stats.available_slots_today', 0));
});
