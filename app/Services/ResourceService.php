<?php

namespace App\Services;

use App\Contracts\Repositories\CourtRepositoryInterface;
use App\Models\Court;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CourtService
{
    public function __construct(
        private readonly CourtRepositoryInterface $courtRepository,
    ) {}

    public function paginate(int $perPage = 15): LengthAwarePaginator
    {
        return $this->courtRepository->paginate($perPage);
    }

    public function find(int $id): ?Court
    {
        return $this->courtRepository->find($id);
    }

    public function create(array $data, array $photos = []): Court
    {
        $data['photos'] = $this->storePhotos($photos);

        return $this->courtRepository->create($data);
    }

    public function update(Court $court, array $data, array $photos = []): Court
    {
        if ($photos !== []) {
            $existing = $court->photos ?? [];
            $data['photos'] = array_merge($existing, $this->storePhotos($photos, $court->id));
        }

        return $this->courtRepository->update($court, $data);
    }

    public function delete(Court $court): bool
    {
        foreach ($court->photos ?? [] as $photo) {
            Storage::disk('public')->delete($photo);
        }

        return $this->courtRepository->delete($court);
    }

    /**
     * @param  list<UploadedFile>  $photos
     * @return list<string>
     */
    private function storePhotos(array $photos, ?int $courtId = null): array
    {
        $paths = [];

        foreach ($photos as $photo) {
            if (! $photo instanceof UploadedFile) {
                continue;
            }

            $directory = $courtId ? "courts/{$courtId}" : 'courts/temp';
            $filename = Str::uuid()->toString().'.'.$photo->getClientOriginalExtension();
            $paths[] = $photo->storeAs($directory, $filename, 'public');
        }

        return $paths;
    }
}
