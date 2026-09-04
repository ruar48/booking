<?php

namespace App\Http\Controllers;

use App\Contracts\Repositories\ResourceRepositoryInterface;
use App\Enums\ResourceStatus;
use App\Enums\Sport;
use App\Enums\SurfaceType;
use App\Http\Requests\StoreResourceRequest;
use App\Http\Requests\UpdateResourceRequest;
use App\Models\Resource;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ResourceController extends Controller
{
    public function __construct(
        private readonly ResourceRepositoryInterface $resourceRepository,
    ) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Resource::class);

        $filters = $request->only(['search', 'sport', 'status', 'sort', 'direction']);

        return Inertia::render('resources/index', [
            'resources' => $this->resourceRepository->paginateFiltered($filters),
            'filters' => $filters,
            // Counted across every resource, not just the current page, so the
            // totals don't change as the admin pages through the table.
            'stats' => [
                'total' => Resource::query()->count(),
                'pickleball' => Resource::query()->where('sport', Sport::Pickleball)->count(),
                'billiards' => Resource::query()->where('sport', Sport::Billiards)->count(),
                'available' => Resource::query()->where('status', ResourceStatus::Available)->count(),
                'min_rate' => (float) (Resource::query()->min('hourly_rate') ?? 0),
            ],
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
