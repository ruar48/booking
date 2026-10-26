<?php

use App\Enums\Role;
use App\Models\Coach;
use App\Models\User;
use App\Services\HomePageService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia;

/**
 * Admin manages the coach roster; active coaches show on the public page
 * with their weekly availability.
 */
function coachUser(Role $role): User
{
    $user = User::factory()->create();
    $user->assignRole($role->value);

    return $user;
}

beforeEach(function () {
    Storage::fake('coaches');
    HomePageService::forget();
});

it('adds a coach with a photo and weekly availability, no user account needed', function () {
    $this->actingAs(coachUser(Role::ClubAdmin))
        ->post(route('coaches.store'), [
            'name' => 'Coach Ana Reyes',
            'photo' => UploadedFile::fake()->image('ana.jpg'),
            'phone' => '0917 123 4567',
            'years_experience' => 5,
            'rate_per_hour' => 600,
            'specialties' => ['Beginners', ' Dinking ', ''],
            'availability' => [
                ['day' => 6, 'start' => '08:00', 'end' => '11:00'],
                ['day' => 1, 'start' => '17:00', 'end' => '20:00'],
            ],
            'is_active' => true,
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('coaches.index'));

    $coach = Coach::query()->sole();

    expect($coach->user_id)->toBeNull()
        ->and($coach->specialties)->toBe(['Beginners', 'Dinking'])
        // Stored Monday-first regardless of the order entered.
        ->and($coach->availability)->toBe([
            ['day' => 1, 'start' => '17:00', 'end' => '20:00'],
            ['day' => 6, 'start' => '08:00', 'end' => '11:00'],
        ]);

    Storage::disk('coaches')->assertExists($coach->photo_path);
});

it('rejects a time slot that ends before it starts', function () {
    $this->actingAs(coachUser(Role::ClubAdmin))
        ->post(route('coaches.store'), [
            'name' => 'Coach Ben',
            'availability' => [['day' => 2, 'start' => '10:00', 'end' => '09:00']],
        ])
        ->assertSessionHasErrors('availability.0.end');

    expect(Coach::count())->toBe(0);
});

it('replaces the photo on update and removes the old file', function () {
    $oldPath = UploadedFile::fake()->image('old.jpg')->store('', 'coaches');
    $coach = Coach::factory()->create(['photo_path' => $oldPath, 'specialties' => ['Doubles']]);

    // Multipart forms reach update as POST with _method, like the admin page sends.
    $this->actingAs(coachUser(Role::ClubAdmin))
        ->post(route('coaches.update', $coach), [
            '_method' => 'patch',
            'name' => 'Renamed Coach',
            'photo' => UploadedFile::fake()->image('new.jpg'),
            'is_active' => false,
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('coaches.index'));

    $coach->refresh();

    expect($coach->name)->toBe('Renamed Coach')
        ->and($coach->is_active)->toBeFalse()
        // Omitted lists mean cleared: FormData drops empty arrays.
        ->and($coach->specialties)->toBe([])
        ->and($coach->photo_path)->not->toBe($oldPath);

    Storage::disk('coaches')->assertMissing($oldPath);
    Storage::disk('coaches')->assertExists($coach->photo_path);
});

it('removes a coach and their photo', function () {
    $path = UploadedFile::fake()->image('coach.jpg')->store('', 'coaches');
    $coach = Coach::factory()->create(['photo_path' => $path]);

    $this->actingAs(coachUser(Role::ClubAdmin))
        ->delete(route('coaches.destroy', $coach))
        ->assertRedirect(route('coaches.index'));

    expect(Coach::count())->toBe(0);
    Storage::disk('coaches')->assertMissing($path);
});

it('keeps non-admins out', function () {
    $player = coachUser(Role::Player);

    // The venue.admin middleware bounces non-admins rather than 403ing.
    $this->actingAs($player)->get(route('coaches.index'))->assertRedirect();
    $this->actingAs($player)->post(route('coaches.store'), ['name' => 'Sneaky']);

    expect(Coach::count())->toBe(0);
});

it('shows only active coaches on the public page with today worked out', function () {
    // A Wednesday.
    Carbon::setTestNow(Carbon::parse('2026-10-21 09:00:00'));

    Coach::factory()->create([
        'name' => 'Today Coach',
        'availability' => [
            ['day' => 3, 'start' => '07:00', 'end' => '10:00'],
            ['day' => 5, 'start' => '16:00', 'end' => '18:00'],
        ],
    ]);
    Coach::factory()->create([
        'name' => 'Friday Coach',
        'availability' => [['day' => 5, 'start' => '08:00', 'end' => '12:00']],
    ]);
    Coach::factory()->inactive()->create(['name' => 'Hidden Coach']);

    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('welcome')
            ->has('coaches', 2)
            ->where('coaches.0.name', 'Friday Coach')
            ->where('coaches.0.today_slots', [])
            ->where('coaches.0.next_available_day', 'Fri')
            ->where('coaches.0.schedule.0.label', 'Mon')
            ->where('coaches.0.schedule.4.slots', [['start' => '08:00', 'end' => '12:00']])
            ->where('coaches.1.name', 'Today Coach')
            ->where('coaches.1.today_slots', [['start' => '07:00', 'end' => '10:00']])
            ->where('coaches.1.next_available_day', null));
});
