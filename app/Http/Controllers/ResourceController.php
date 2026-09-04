<?php

namespace App\Http\Controllers;

use App\Contracts\Repositories\ResourceRepositoryInterface;
use App\Enums\SurfaceType;
use App\Http\Requests\StoreResourceRequest;
use App\Http\Requests\UpdateResourceRequest;
use App\Models\Resource;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ResourceController extends Controller
{
    public function __construct(
        private readonly ResourceRepositoryInterface $resourceRepository,
    ) {}

    public function index(): Response
    {
        $this->authorize('viewAny', Resource::class);

        return Inertia::render('resources/index', [
            'resources' => $this->resourceRepository->paginate(),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Resource::class);

        return Inertia::render('resources/create', [
            'surfaceTypes' => SurfaceType::options(),
        ]);
    }

    public function store(StoreResourceRequest $request): RedirectResponse
    {
        $resource = $this->resourceRepository->create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Resource created.')]);

        return to_route('resources.edit', $resource);
    }

    public function edit(Resource $resource): Response
    {
        $this->authorize('update', $resource);

        return Inertia::render('resources/edit', [
            'resource' => $resource,
            'surfaceTypes' => SurfaceType::options(),
        ]);
    }

    public function update(UpdateResourceRequest $request, Resource $resource): RedirectResponse
    {
        $this->resourceRepository->update($resource, $request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Resource updated.')]);

        return to_route('resources.index');
    }

    public function destroy(Resource $resource): RedirectResponse
    {
        $this->authorize('delete', $resource);

        $this->resourceRepository->delete($resource);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Resource deleted.')]);

        return to_route('resources.index');
    }
}
