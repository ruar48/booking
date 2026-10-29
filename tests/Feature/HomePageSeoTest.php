<?php

use App\Models\Setting;
use App\Services\HomePageService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

/**
 * The head comes from React's SSR output when the SSR server is up and from
 * the Blade fallback when it isn't; either way there must be exactly one set.
 *
 * @return list<string>
 */
function headMatches(string $html, string $pattern): array
{
    $head = strstr($html, '</head>', true) ?: $html;
    preg_match_all($pattern, $head, $matches);

    return $matches[1];
}

beforeEach(function () {
    // A migration seeds the venue profile row, so fill it in rather than insert one.
    Setting::query()->updateOrCreate(['group' => 'venue', 'key' => 'profile'], [
        'value' => [
            'address_line_1' => 'Santa Maria Norte',
            'city' => 'Binalonan',
            'state' => 'Pangasinan',
            'postal_code' => '2436',
            'phone' => '+639507370338',
            'latitude' => 16.05,
            'longitude' => 120.59,
        ],
    ]);

    HomePageService::forget();
});

it('puts the town and province in the title and description the server sends', function () {
    $html = $this->get(route('home'))->assertOk()->getContent();

    expect(headMatches($html, '#<title[^>]*>(.*?)</title>#s'))
        ->toBe([e(config('app.name')).': Courts in Binalonan, Pangasinan'])
        ->and(headMatches($html, '#<meta name="description" content="([^"]*)"#'))
        ->toHaveCount(1)
        ->{0}->toStartWith('Pickleball courts, billiards and table tennis in Santa Maria Norte, Binalonan, Pangasinan.');
});

it('sends the same tags from the Blade fallback when SSR is down', function () {
    config(['inertia.ssr.enabled' => false]);

    $html = $this->get(route('home'))->assertOk()->getContent();

    expect(headMatches($html, '#<title[^>]*>(.*?)</title>#s'))
        ->toBe([e(config('app.name')).': Courts in Binalonan, Pangasinan'])
        ->and(headMatches($html, '#<meta name="description" content="([^"]*)"#'))
        ->toBe(['Pickleball courts, billiards and table tennis in Santa Maria Norte, Binalonan, Pangasinan. Book courts online, join open play and rent paddles.'])
        ->and(headMatches($html, '#<script type="application/ld\+json"[^>]*>(.*?)</script>#s'))
        ->toHaveCount(1);
});

it('sends schema.org venue data in the HTML', function () {
    $html = $this->get(route('home'))->getContent();

    $scripts = headMatches($html, '#<script type="application/ld\+json"[^>]*>(.*?)</script>#s');
    $data = json_decode(html_entity_decode($scripts[0] ?? ''), true);

    expect($scripts)->toHaveCount(1)
        ->and($data)->toMatchArray(['@type' => 'SportsActivityLocation', 'telephone' => '+639507370338'])
        ->and($data['address'])->toMatchArray([
            'addressLocality' => 'Binalonan',
            'addressRegion' => 'Pangasinan',
            'postalCode' => '2436',
        ])
        ->and($data['geo'])->toMatchArray(['latitude' => 16.05, 'longitude' => 120.59]);
});

it('hands the same metadata to the page', function () {
    $this->get(route('home'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('seo.location', 'Santa Maria Norte, Binalonan, Pangasinan')
            ->where('seo.title', config('app.name').': Courts in Binalonan, Pangasinan'));
});

it('falls back to a generic title when no address is set', function () {
    Setting::query()->where('group', 'venue')->delete();
    HomePageService::forget();

    $this->get(route('home'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('seo.location', null)
            ->where('seo.title', config('app.name').': Courts & Billiards'));
});

it('sends readable page content for crawlers that skip JavaScript', function () {
    config(['inertia.ssr.enabled' => false]);

    $body = strstr($this->get(route('home'))->getContent(), '<body');

    expect($body)
        ->toMatch('#<div id="app">\s*<div class="min-h-screen#')
        ->toContain('<h1')
        ->toContain('Pickleball courts &amp; billiards in Santa Maria Norte, Binalonan, Pangasinan')
        ->toContain('href="tel:+639507370338"')
        ->toContain('href="'.route('login').'"');
});

it('leaves other pages to React alone', function () {
    config(['inertia.ssr.enabled' => false]);

    expect($this->get(route('login'))->getContent())->toMatch('#<div id="app"></div>#');
});

it('serves a plain-text venue summary at llms.txt', function () {
    $this->get('/llms.txt')
        ->assertOk()
        ->assertHeader('Content-Type', 'text/plain; charset=utf-8')
        ->assertSee('# '.config('app.name'), false)
        ->assertSee('Address: Santa Maria Norte, Binalonan, Pangasinan, 2436, Philippines', false)
        ->assertSee('Phone: +639507370338', false);
});

it('keeps venue data off other pages', function () {
    expect(headMatches($this->get(route('login'))->getContent(), '#<script type="application/ld\+json"[^>]*>(.*?)</script>#s'))
        ->toBe([]);
});
