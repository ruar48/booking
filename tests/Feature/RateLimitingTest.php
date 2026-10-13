<?php

use App\Models\PageView;
use App\Services\HomePageService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

const RATE_TEST_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36';

it('serves the home page from cache on repeat visits', function () {
    $this->get('/')->assertOk();

    expect(Cache::has(HomePageService::CACHE_KEY))->toBeTrue();

    DB::enableQueryLog();
    $this->get('/')->assertOk();

    $homeQueries = collect(DB::getQueryLog())
        ->pluck('query')
        ->filter(fn (string $sql) => str_contains($sql, 'resource_bookings') || str_contains($sql, 'open_play_sessions'));

    expect($homeQueries)->toBeEmpty();
});

it('rate limits a guest hammering the site', function () {
    for ($i = 0; $i < 120; $i++) {
        $this->get('/')->assertOk();
    }

    $this->get('/')->assertStatus(429);
});

it('stops recording page views past the per-minute budget', function () {
    for ($i = 0; $i < 40; $i++) {
        $this->withHeaders(['User-Agent' => RATE_TEST_UA])->get('/');
    }

    expect(PageView::query()->count())->toBe(30);
});

it('limits sign-ups per IP per hour', function () {
    for ($i = 0; $i < 10; $i++) {
        $this->post('/register', ['name' => 'x', 'email' => "bad{$i}"]);
    }

    $this->post('/register', ['name' => 'x', 'email' => 'bad'])->assertStatus(429);
});

it('does not rate limit the PayMongo webhook', function () {
    $statuses = collect(range(1, 130))
        ->map(fn () => $this->postJson('/webhooks/paymongo', [])->getStatusCode());

    expect($statuses)->not->toContain(429);
});
