<?php

use App\Enums\Role as RoleEnum;
use App\Models\PageView;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

function analyticsUser(RoleEnum $role): User
{
    Role::findOrCreate($role->value, 'web');

    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole($role->value);

    return $user;
}

const BROWSER_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148';

it('records a guest page view without storing the IP', function () {
    $this->withHeaders(['User-Agent' => BROWSER_UA, 'Referer' => 'https://www.facebook.com/somepost'])
        ->get('/')
        ->assertOk();

    $view = PageView::query()->sole();

    expect($view->user_id)->toBeNull()
        ->and($view->route_name)->toBe('home')
        ->and($view->path)->toBe('/')
        ->and($view->device)->toBe('mobile')
        ->and($view->referrer_host)->toBe('facebook.com')
        ->and($view->visitor_hash)->toHaveLength(64)
        ->and($view->visitor_hash)->not->toContain('127.0.0.1');
});

it('does not record bots, partial reloads, or staff', function () {
    $this->withHeaders(['User-Agent' => 'Googlebot/2.1'])->get('/')->assertOk();

    $this->withHeaders([
        'User-Agent' => BROWSER_UA,
        'X-Inertia' => 'true',
        'X-Inertia-Partial-Data' => 'registration',
        'X-Inertia-Partial-Component' => 'welcome',
    ])->get('/');

    $this->flushHeaders()->actingAs(analyticsUser(RoleEnum::ClubAdmin))
        ->withHeaders(['User-Agent' => BROWSER_UA])
        ->get('/')
        ->assertOk();

    expect(PageView::query()->count())->toBe(0);
});

it('shows admins the analytics summary', function () {
    $member = analyticsUser(RoleEnum::Player);

    PageView::query()->create(['visitor_hash' => str_repeat('a', 64), 'path' => '/', 'route_name' => 'home', 'device' => 'mobile']);
    PageView::query()->create(['visitor_hash' => str_repeat('a', 64), 'path' => '/open-play/browse', 'route_name' => 'open-play.browse', 'device' => 'mobile']);
    PageView::query()->create(['user_id' => $member->id, 'visitor_hash' => str_repeat('b', 64), 'path' => '/', 'route_name' => 'home', 'device' => 'desktop']);

    $this->withoutVite()
        ->actingAs(analyticsUser(RoleEnum::ClubAdmin))
        ->get(route('admin.analytics.index', ['range' => 7]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/analytics/index')
            ->where('analytics.totals.views', 3)
            ->where('analytics.totals.visitors', 2)
            ->where('analytics.totals.signed_in_users', 1)
            ->where('analytics.totals.guest_views', 2)
            ->where('analytics.pages.0.label', 'Home')
            ->where('analytics.pages.0.views', 2)
            ->has('analytics.members', 1)
            ->where('analytics.members.0.name', $member->name)
            ->where('analytics.members.0.recent_pages.0.label', 'Home')
            ->has('analytics.daily', 7));
});

it('keeps players out of analytics', function () {
    $this->actingAs(analyticsUser(RoleEnum::Player))
        ->get(route('admin.analytics.index'))
        ->assertRedirect(route('bookings.index'));
});

it('rejects an unsupported range', function () {
    $this->actingAs(analyticsUser(RoleEnum::ClubAdmin))
        ->get(route('admin.analytics.index', ['range' => 9999]))
        ->assertSessionHasErrors('range');
});
