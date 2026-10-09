<?php

namespace App\Services;

use App\Models\GalleryCategory;
use App\Models\GalleryPhoto;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * Keeps the gallery's files on disk and its rows in step: a photo is never
 * left as a row pointing at a missing file, or a file nothing references.
 */
class GalleryService
{
    /**
     * Newest first.
     *
     * @return Collection<int, GalleryPhoto>
     */
    public function all(): Collection
    {
        return GalleryPhoto::query()
            ->orderBy('sort_order')
            ->latest()
            ->get();
    }

    /** Matches the max:5120 (KB) rule in StoreGalleryPhotoRequest. */
    public const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

    /**
     * The largest photo this server will actually accept: the app's own limit,
     * or PHP's upload_max_filesize if that is lower. PHP drops an over-limit
     * file before validation runs, so the upload form checks against this.
     */
    public function maxUploadBytes(): int
    {
        $phpLimit = $this->iniBytes((string) ini_get('upload_max_filesize'));

        return $phpLimit > 0 ? min(self::MAX_PHOTO_BYTES, $phpLimit) : self::MAX_PHOTO_BYTES;
    }

    private function iniBytes(string $value): int
    {
        $value = trim($value);
        $number = (int) $value;

        return match (strtolower(substr($value, -1))) {
            'g' => $number * 1024 ** 3,
            'm' => $number * 1024 ** 2,
            'k' => $number * 1024,
            default => $number,
        };
    }

    /**
     * @return Collection<int, GalleryCategory>
     */
    public function categories(): Collection
    {
        return GalleryCategory::query()
            ->withCount('photos')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();
    }

    /**
     * The public Photos tab: one section per category that has photos, in
     * category order, then uncategorized photos last. Empty categories are
     * left out so visitors never see a heading with nothing under it.
     *
     * @return list<array{id: int|null, name: string, photos: Collection<int, GalleryPhoto>}>
     */
    public function publicSections(): array
    {
        $photos = $this->all()->groupBy(fn (GalleryPhoto $photo) => $photo->gallery_category_id ?? 0);

        $sections = $this->categories()
            ->filter(fn (GalleryCategory $category) => $photos->has($category->id))
            ->map(fn (GalleryCategory $category) => [
                'id' => $category->id,
                'name' => $category->name,
                'photos' => $photos->get($category->id)->values(),
            ])
            ->values()
            ->all();

        if ($photos->has(0)) {
            $sections[] = [
                'id' => null,
                'name' => $sections === [] ? 'Gallery' : 'More photos',
                'photos' => $photos->get(0)->values(),
            ];
        }

        return $sections;
    }

    /**
     * @param  list<UploadedFile>  $files
     */
    public function upload(array $files, ?string $caption, ?int $categoryId, User $uploader): int
    {
        $stored = [];

        try {
            DB::transaction(function () use ($files, $caption, $categoryId, $uploader, &$stored): void {
                foreach ($files as $file) {
                    // The disk is configured not to throw, so a failed write
                    // comes back as false rather than an exception.
                    $path = $file->store('', 'gallery');

                    if ($path === false) {
                        throw new \RuntimeException("Could not write {$file->getClientOriginalName()} to the gallery disk.");
                    }

                    $stored[] = $path;

                    GalleryPhoto::query()->create([
                        'gallery_category_id' => $categoryId,
                        'path' => $path,
                        'caption' => $caption,
                        'uploaded_by' => $uploader->id,
                    ]);
                }
            });
        } catch (\Throwable $e) {
            // The rows rolled back; remove the files that were already written.
            Storage::disk('gallery')->delete($stored);

            throw $e;
        }

        return count($stored);
    }

    public function delete(GalleryPhoto $photo): void
    {
        DB::transaction(fn () => $photo->delete());

        Storage::disk('gallery')->delete($photo->path);
    }

    /**
     * Deleting a category keeps its photos; they move to the uncategorized
     * section. Done explicitly rather than trusting the FK's ON DELETE SET
     * NULL, which SQLite only honours with foreign keys switched on.
     */
    public function deleteCategory(GalleryCategory $category): void
    {
        DB::transaction(function () use ($category): void {
            $category->photos()->update(['gallery_category_id' => null]);
            $category->delete();
        });
    }
}
