<?php

use App\Enums\PolicyPlacement;
use App\Enums\ResourceStatus;
use App\Enums\Role as RoleEnum;
use App\Enums\Sport;
use App\Models\LoginHistory;
use App\Models\PageView;
use App\Models\Policy;
use App\Models\Resource;
use App\Models\Setting;
use App\Models\User;
use Database\Seeders\CourtRulesSeeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Testing\TestResponse;
use Spatie\Permission\Models\Role;

/**
 * The FAQ, Terms of Service and Privacy Notice: readable by anyone, and
 * stating how the venue is really set up rather than a copy that drifts.
 */

// These render full pages; the tests must not depend on a fresh Vite build.
beforeEach(fn () => $this->withoutVite());

/**
 * @param  array<string, mixed>  $overrides
 */
function legalVenueProfile(array $overrides = []): void
{
    Setting::query()->updateOrCreate(
        ['group' => 'venue', 'key' => 'profile'],
        ['value' => [
            'address_line_1' => 'Santa Maria Norte',
            'city' => 'Binalonan',
            'state' => 'Pangasinan',
            'postal_code' => '2436',
            'country' => 'PH',
            'email' => 'hello@example.com',
            'phone' => '+639170000000',
            'amenities' => ['Restrooms', 'Equipment rental'],
            ...$overrides,
        ]],
    );
}

function legalUser(RoleEnum $role): User
{
    Role::findOrCreate($role->value, 'web');

    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole($role->value);

    return $user;
}

/**
 * @return Collection<string, array<string, mixed>>
 */
function faqQuestions(TestResponse $response): Collection
{
    return collect(data_get($response->viewData('page'), 'props.topics'))
        ->flatMap(fn (array $topic): array => $topic['questions'])
        ->keyBy('id');
}

it('lets guests read the FAQ, Terms of Service and Privacy Notice', function () {
    $this->get(route('faq'))->assertOk()->assertInertia(fn ($page) => $page->component('faq')->has('topics', 6));
    $this->get(route('legal.terms'))->assertOk()->assertInertia(fn ($page) => $page->component('legal/terms'));
    $this->get(route('legal.privacy'))->assertOk()->assertInertia(fn ($page) => $page->component('legal/privacy'));
});

it('states the business, payment hold, booking policy and house rules the venue runs on', function () {
    $this->seed(CourtRulesSeeder::class);
    legalVenueProfile(['legal_name' => 'GR Sports Ventures', 'registration_number' => 'DTI-1234567']);
    Setting::query()->updateOrCreate(['group' => 'bookings', 'key' => 'unpaid_cancel_minutes'], ['value' => 45]);
    Policy::query()->create([
        'title' => 'Payment policy',
        'placement' => PolicyPlacement::Checkout,
        'body' => "Paid bookings are final.\n  No refunds unless we cancel.  \n",
    ]);
    Policy::query()->create([
        'title' => 'Old rule',
        'placement' => PolicyPlacement::CourtRules,
        'body' => 'A retired rule',
        'is_active' => false,
    ]);
    config(['legal.terms.version' => '2026-11-05']);

    $this->get(route('legal.terms'))->assertInertia(fn ($page) => $page
        ->where('business.legal_name', 'GR Sports Ventures')
        ->where('business.registration_number', 'DTI-1234567')
        ->where('business.address', 'Santa Maria Norte, Binalonan, Pangasinan 2436, Philippines')
        ->where('holdMinutes', 45)
        ->where('document.version', '2026-11-05')
        ->where('bookingPolicy', fn (Collection $lines) => $lines->contains('Paid bookings are final.')
            && $lines->contains('No refunds unless we cancel.'))
        ->where('courtRules', fn (Collection $rules) => $rules->all() === CourtRulesSeeder::RULES));
});

it('names a privacy contact before a DPO email is set, and states the real retention periods', function () {
    legalVenueProfile();

    $this->get(route('legal.privacy'))->assertInertia(fn ($page) => $page
        ->where('business.dpo_email', 'hello@example.com')
        ->where('business.dpo_name', null)
        ->where('retention.pageViewDays', PageView::RETENTION_DAYS)
        ->where('retention.loginHistoryDays', LoginHistory::RETENTION_DAYS));

    legalVenueProfile(['dpo_name' => 'Maria Santos', 'dpo_email' => 'privacy@example.com']);

    $this->get(route('legal.privacy'))->assertInertia(fn ($page) => $page
        ->where('business.dpo_name', 'Maria Santos')
        ->where('business.dpo_email', 'privacy@example.com'));
});

it('answers rates, the payment hold, fees and facilities from live settings', function () {
    $this->seed(CourtRulesSeeder::class);
    legalVenueProfile();
    Setting::query()->updateOrCreate(['group' => 'bookings', 'key' => 'unpaid_cancel_minutes'], ['value' => 30]);
    config(['services.paymongo.fee_percent' => 1.5, 'services.paymongo.fee_fixed' => 0]);
    Resource::factory()->create([
        'name' => 'Court 9',
        'sport' => Sport::Pickleball,
        'status' => ResourceStatus::Available,
        'hourly_rate' => 300,
        'evening_rate' => 350,
    ]);

    $questions = faqQuestions($this->get(route('faq'))->assertOk());

    expect($questions['hold']['answer'])->toContain('30 minutes')
        ->and($questions['fee']['answer'])->toContain('about 1.5% of the booking amount')
        ->and($questions['rates']['bullets'])->toBe(['Court 9: ₱300/hour, ₱350/hour from 6 PM'])
        ->and($questions['court-rules']['bullets'])->toBe(CourtRulesSeeder::RULES)
        ->and($questions['location']['answer'])->toBe('Santa Maria Norte, Binalonan, Pangasinan 2436, Philippines')
        ->and($questions['contact']['answer'])->toContain('+639170000000')
        // "Equipment rental" is one of the amenities, so rentals are explained.
        ->and($questions->has('rentals'))->toBeTrue();

    config(['services.paymongo.fee_percent' => 0]);

    expect(faqQuestions($this->get(route('faq')))['fee']['answer'])->toBe('No. You pay exactly the court rate.');
});

it('lists the help and legal pages in the sitemap', function () {
    $this->get('/sitemap.xml')
        ->assertOk()
        ->assertSee(route('faq'), false)
        ->assertSee(route('legal.terms'), false)
        ->assertSee(route('legal.privacy'), false);
});

it('seeds starter court rules that the home and booking pages show', function () {
    // Migrating alone adds no rules, and the pages simply leave them out.
    expect(Policy::linesAt(PolicyPlacement::CourtRules))->toBe([]);

    $this->seed(CourtRulesSeeder::class);

    $rules = Policy::linesAt(PolicyPlacement::CourtRules);

    expect($rules)->toBe(CourtRulesSeeder::RULES);

    $this->get('/')->assertInertia(fn ($page) => $page->component('welcome')->where('courtRules', $rules));

    $this->actingAs(legalUser(RoleEnum::Player))
        ->get(route('bookings.create'))
        ->assertInertia(fn ($page) => $page->where('courtRules', $rules));
});

it('seeds only the court rules, never twice and never over an edit', function () {
    $rowCounts = fn (): array => collect(Schema::getTables())
        ->mapWithKeys(fn (array $table): array => [$table['name'] => DB::table($table['name'])->count()])
        ->all();
    $before = $rowCounts();

    $this->seed(CourtRulesSeeder::class);

    // One new policy row and nothing else: no demo users, courts, products or settings.
    expect(array_diff_assoc($rowCounts(), $before))->toBe(['policies' => $before['policies'] + 1]);

    $policy = Policy::query()->where('placement', PolicyPlacement::CourtRules)->sole();
    $policy->update(['body' => 'Our own house rules.']);

    $this->seed(CourtRulesSeeder::class);

    expect(Policy::query()->where('placement', PolicyPlacement::CourtRules)->count())->toBe(1)
        ->and($policy->fresh()?->body)->toBe('Our own house rules.');
});

it('lets the owner manage court rules like any other policy, one rule per line', function () {
    $this->actingAs(legalUser(RoleEnum::SuperAdmin))
        ->post(route('admin.policies.store'), [
            'title' => 'Extra rules',
            'placement' => 'court_rules',
            'body' => "Maximum of 6 players per court.\n\nBring your own water bottle.",
            'is_active' => true,
            'sort_order' => 1,
        ])
        ->assertRedirect(route('admin.policies.index'));

    expect(Policy::linesAt(PolicyPlacement::CourtRules))
        ->toContain('Maximum of 6 players per court.')
        ->toContain('Bring your own water bottle.')
        ->not->toContain('');

    $this->post(route('admin.policies.store'), ['title' => 'Bad', 'placement' => 'homepage_banner', 'body' => 'x'])
        ->assertSessionHasErrors('placement');
});

it('deletes login history once it is past the retention period', function () {
    $user = User::factory()->create();
    LoginHistory::query()->create(['user_id' => $user->id, 'logged_in_at' => now()->subDays(LoginHistory::RETENTION_DAYS + 1)]);
    LoginHistory::query()->create(['user_id' => $user->id, 'logged_in_at' => now()->subDays(10)]);

    $this->artisan('model:prune', ['--model' => [LoginHistory::class]])->assertSuccessful();

    expect(LoginHistory::query()->count())->toBe(1);
});
