<?php

namespace App\Services;

use App\Contracts\Repositories\ResourceRepositoryInterface;
use App\Models\Resource;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ResourceService
{
    public function __construct(
        private readonly ResourceRepositoryInterface $resourceRepository,
    ) {}

    public function paginate(int $perPage = 15): LengthAwarePaginator
    {
        return $this->resourceRepository->paginate($perPage);
    }

    public function find(int $id): ?Resource
    {
        return $this->resourceRepository->find($id);
    }

    public function create(array $data, array $photos = []): Resource
    {
        $data['photos'] = $this->storePhotos($photos);

        return $this->resourceRepository->create($data);
    }

    public function update(Resource $resource, array $data, array $photos = []): Resource
    {
        if ($photos !== []) {
            $existing = $resource->photos ?? [];
            $data['photos'] = array_merge($existing, $this->storePhotos($photos, $resource->id));
        }

        return $this->resourceRepository->update($resource, $data);
    }

    public function delete(Resource $resource): bool
    {
        foreach ($resource->photos ?? [] as $photo) {
            Storage::disk('public')->delete($photo);
        }

        return $this->resourceRepository->delete($resource);
    }

    /**
     * @param  list<UploadedFile>  $photos
     * @return list<string>
     */
    private function storePhotos(array $photos, ?int $resourceId = null): array
    {
        $paths = [];

        foreach ($photos as $photo) {
            if (! $photo instanceof UploadedFile) {
                continue;
            }

            $directory = $resourceId ? "resources/{$resourceId}" : 'resources/temp';
            $filename = Str::uuid()->toString().'.'.$photo->getClientOriginalExtension();
            $paths[] = $photo->storeAs($directory, $filename, 'public');
        }

        return $paths;
    }
}
