<?php

use App\Enums\Role;
use App\Models\GalleryCategory;
use App\Models\GalleryPhoto;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia;

/**
 * Admin uploads venue photos; they show on the public page's Photos tab.
 */
function galleryUser(Role $role): User
{
    $user = User::factory()->create();
    $user->assignRole($role->value);

    return $user;
}

beforeEach(function () {
    Storage::fake('gallery');
});

it('uploads several photos with a shared caption', function () {
    $this->actingAs(galleryUser(Role::ClubAdmin))
        ->post(route('admin.gallery.store'), [
            'photos' => [
                UploadedFile::fake()->image('court.jpg'),
                UploadedFile::fake()->image('lounge.png'),
            ],
            'caption' => 'Male Court at night',
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('admin.gallery.index'));

    $photos = GalleryPhoto::all();

    expect($photos)->toHaveCount(2)
        ->and($photos->pluck('caption')->unique()->all())->toBe(['Male Court at night']);

    $photos->each(fn (GalleryPhoto $photo) => Storage::disk('gallery')->assertExists($photo->path));
});

it('rejects files that are not photos', function () {
    $this->actingAs(galleryUser(Role::ClubAdmin))
        ->post(route('admin.gallery.store'), [
            'photos' => [UploadedFile::fake()->create('notes.pdf', 10, 'application/pdf')],
        ])
        ->assertSessionHasErrors('photos.0');

    expect(GalleryPhoto::count())->toBe(0);
});

it('deletes the photo and its file', function () {
    $path = UploadedFile::fake()->image('court.jpg')->store('', 'gallery');
    $photo = GalleryPhoto::query()->create(['path' => $path]);

    $this->actingAs(galleryUser(Role::ClubAdmin))
        ->delete(route('admin.gallery.destroy', $photo))
        ->assertRedirect(route('admin.gallery.index'));

    expect(GalleryPhoto::count())->toBe(0);
    Storage::disk('gallery')->assertMissing($path);
});

it('keeps non-admins out', function () {
    $this->actingAs(galleryUser(Role::Player))
        ->post(route('admin.gallery.store'), [
            'photos' => [UploadedFile::fake()->image('court.jpg')],
        ]);

    expect(GalleryPhoto::count())->toBe(0);
});

it('groups the public page by category, skipping empty ones, uncategorized last', function () {
    $courts = GalleryCategory::query()->where('name', 'Our courts')->sole();
    GalleryCategory::query()->create(['name' => 'Events', 'sort_order' => 1]);

    $courtPhoto = GalleryPhoto::query()->create(['path' => 'court.jpg', 'caption' => 'Male Court', 'gallery_category_id' => $courts->id]);
    GalleryPhoto::query()->create(['path' => 'misc.jpg']);

    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has('gallery', 2)
            ->where('gallery.0.name', 'Our courts')
            ->where('gallery.0.photos.0.caption', 'Male Court')
            ->where('gallery.0.photos.0.url', $courtPhoto->url)
            ->where('gallery.1.id', null)
            ->where('gallery.1.name', 'More photos'));
});

it('starts with an "Our courts" category', function () {
    expect(GalleryCategory::query()->pluck('name')->all())->toBe(['Our courts']);
});

it('adds, renames and refuses duplicate categories', function () {
    $admin = galleryUser(Role::ClubAdmin);

    $this->actingAs($admin)
        ->post(route('admin.gallery-categories.store'), ['name' => 'Events'])
        ->assertSessionHasNoErrors();

    $events = GalleryCategory::query()->where('name', 'Events')->sole();

    $this->actingAs($admin)
        ->post(route('admin.gallery-categories.store'), ['name' => 'Events'])
        ->assertSessionHasErrors('name');

    $this->actingAs($admin)
        ->patch(route('admin.gallery-categories.update', $events), ['name' => 'Tournaments'])
        ->assertSessionHasNoErrors();

    // Renaming to its own current name is not a duplicate.
    $this->actingAs($admin)
        ->patch(route('admin.gallery-categories.update', $events), ['name' => 'Tournaments'])
        ->assertSessionHasNoErrors();

    expect($events->fresh()->name)->toBe('Tournaments');
});

it('keeps photos when their category is deleted', function () {
    $category = GalleryCategory::query()->create(['name' => 'Events']);
    $photo = GalleryPhoto::query()->create(['path' => 'event.jpg', 'gallery_category_id' => $category->id]);

    $this->actingAs(galleryUser(Role::ClubAdmin))
        ->delete(route('admin.gallery-categories.destroy', $category))
        ->assertRedirect(route('admin.gallery.index'));

    expect(GalleryCategory::find($category->id))->toBeNull()
        ->and($photo->fresh()->gallery_category_id)->toBeNull();
});

it('moves a photo to another category and edits its caption', function () {
    $category = GalleryCategory::query()->create(['name' => 'Events']);
    $photo = GalleryPhoto::query()->create(['path' => 'event.jpg']);

    $this->actingAs(galleryUser(Role::ClubAdmin))
        ->patch(route('admin.gallery.update', $photo), [
            'caption' => 'Opening night',
            'gallery_category_id' => $category->id,
        ])
        ->assertSessionHasNoErrors();

    expect($photo->fresh())
        ->caption->toBe('Opening night')
        ->gallery_category_id->toBe($category->id);
});
