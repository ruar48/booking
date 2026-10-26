<?php

namespace App\Services;

use App\Models\Coach;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;

/**
 * The venue's coach roster: admin edits, and the public profile cards on the
 * home page. A coach's photo file and row are kept in step — a failed save
 * never leaves an orphaned file, and a replaced photo is removed from disk.
 */
class CoachService
{
    /** Week order for display, keyed by Carbon's dayOfWeek. */
    public const WEEK = [1 => 'Mon', 2 => 'Tue', 3 => 'Wed', 4 => 'Thu', 5 => 'Fri', 6 => 'Sat', 0 => 'Sun'];

    /**
     * @return Collection<int, Coach>
     */
    public function all(): Collection
    {
        return Coach::query()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, ?UploadedFile $photo): Coach
    {
        $path = $photo ? $this->storePhoto($photo) : null;

        try {
            $coach = Coach::query()->create([
                ...$this->attributes($data),
                'photo_path' => $path,
                'sort_order' => (int) Coach::query()->max('sort_order') + 1,
            ]);
        } catch (\Throwable $e) {
            $this->deletePhoto($path);

            throw $e;
        }

        HomePageService::forget();

        return $coach;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Coach $coach, array $data, ?UploadedFile $photo): Coach
    {
        $oldPath = $coach->photo_path;
        $newPath = $photo ? $this->storePhoto($photo) : null;
        $removing = $photo === null && ! empty($data['remove_photo']);

        try {
            $coach->update([
                ...$this->attributes($data),
                'photo_path' => $newPath ?? ($removing ? null : $oldPath),
            ]);
        } catch (\Throwable $e) {
            $this->deletePhoto($newPath);

            throw $e;
        }

        if ($newPath !== null || $removing) {
            $this->deletePhoto($oldPath);
        }

        HomePageService::forget();

        return $coach;
    }

    public function delete(Coach $coach): void
    {
        // Soft delete keeps any training history pointing at the coach; the
        // photo goes, since nothing shows a removed coach any more.
        $coach->delete();
        $this->deletePhoto($coach->photo_path);

        HomePageService::forget();
    }

    /**
     * Active coaches for the public page, with their week laid out Monday
     * first and today's availability worked out here rather than in the
     * browser. Plain arrays, since the home payload is cached.
     *
     * @return list<array<string, mixed>>
     */
    public function publicProfiles(): array
    {
        $today = now()->dayOfWeek;

        return Coach::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(function (Coach $coach) use ($today): array {
                $byDay = collect($coach->availability ?? [])
                    ->groupBy('day')
                    ->map(fn (Collection $slots) => $slots
                        ->sortBy('start')
                        ->map(fn (array $slot) => ['start' => $slot['start'], 'end' => $slot['end']])
                        ->values()
                        ->all());

                $schedule = collect(self::WEEK)
                    ->map(fn (string $label, int $day) => [
                        'day' => $day,
                        'label' => $label,
                        'slots' => $byDay->get($day, []),
                    ])
                    ->values()
                    ->all();

                return [
                    'id' => $coach->id,
                    'name' => $coach->name,
                    'photo_url' => $coach->photo_url,
                    'phone' => $coach->phone,
                    'bio' => $coach->bio,
                    'specialties' => $coach->specialties ?? [],
                    'certifications' => $coach->certifications ?? [],
                    'years_experience' => $coach->years_experience,
                    'rate_per_hour' => $coach->rate_per_hour !== null ? (float) $coach->rate_per_hour : null,
                    'schedule' => $schedule,
                    'today_slots' => $byDay->get($today, []),
                    'next_available_day' => $byDay->has($today) ? null : $this->nextDayWithSlots($byDay, $today),
                ];
            })
            ->all();
    }

    /**
     * @param  Collection<int, mixed>  $byDay
     */
    private function nextDayWithSlots(Collection $byDay, int $today): ?string
    {
        for ($offset = 1; $offset <= 6; $offset++) {
            $day = ($today + $offset) % 7;

            if ($byDay->has($day)) {
                return $offset === 1 ? 'Tomorrow' : self::WEEK[$day];
            }
        }

        return null;
    }

    /**
     * The form always sends the full coach, so a list missing from the
     * request (FormData drops empty arrays) means it was cleared.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function attributes(array $data): array
    {
        return [
            'name' => trim($data['name']),
            'phone' => $data['phone'] ?? null,
            'bio' => $data['bio'] ?? null,
            'years_experience' => (int) ($data['years_experience'] ?? 0),
            'rate_per_hour' => $data['rate_per_hour'] ?? null,
            'specialties' => $this->cleanList($data['specialties'] ?? []),
            'certifications' => $this->cleanList($data['certifications'] ?? []),
            'availability' => collect($data['availability'] ?? [])
                ->map(fn (array $slot) => [
                    'day' => (int) $slot['day'],
                    'start' => $slot['start'],
                    'end' => $slot['end'],
                ])
                // Monday-first position, then start time ("3" . "07:00").
                ->sortBy(fn (array $slot) => array_search($slot['day'], array_keys(self::WEEK), true).$slot['start'])
                ->values()
                ->all(),
            'is_active' => (bool) ($data['is_active'] ?? true),
        ];
    }

    /**
     * @param  array<int, mixed>  $items
     * @return list<string>
     */
    private function cleanList(array $items): array
    {
        return collect($items)
            ->map(fn ($item) => trim((string) $item))
            ->filter()
            ->unique()
            ->values()
            ->all();
    }

    private function storePhoto(UploadedFile $photo): string
    {
        // The disk is configured not to throw, so a failed write comes back
        // as false rather than an exception.
        $path = $photo->store('', 'coaches');

        if ($path === false) {
            throw new \RuntimeException("Could not write {$photo->getClientOriginalName()} to the coaches disk.");
        }

        return $path;
    }

    private function deletePhoto(?string $path): void
    {
        if ($path !== null) {
            Storage::disk('coaches')->delete($path);
        }
    }
}
