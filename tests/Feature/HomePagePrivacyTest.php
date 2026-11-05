<?php

use App\Models\Announcement;
use App\Models\User;
use App\Services\HomePageService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

/**
 * The home page is public and its props sit in the page source, so anything
 * in them is published to everyone.
 */
uses(RefreshDatabase::class);

it('shows who wrote an announcement by name only, never their contact or account details', function () {
    HomePageService::forget();

    $owner = User::factory()->create([
        'name' => 'Venue Owner',
        'email' => 'owner.private@example.com',
        'phone' => '09179998888',
    ]);
    Announcement::factory()->for($owner, 'creator')->create([
        'title' => 'Courts resurfaced',
        'show_on_home' => true,
        'is_published' => true,
        'published_at' => now()->subHour(),
    ]);

    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('announcements.0.creator', ['id' => $owner->id, 'name' => 'Venue Owner']))
        ->assertDontSee('owner.private@example.com')
        ->assertDontSee('09179998888');
});
