<?php

namespace App\Http\Controllers;

use App\Contracts\Repositories\CourtRepositoryInterface;
use App\Http\Requests\StoreCourtRequest;
use App\Http\Requests\UpdateCourtRequest;
use App\Models\Court;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class CourtController extends Controller
{
    public function __construct(
        private readonly CourtRepositoryInterface $courtRepository,
    ) {}

    public function index(): Response
    {
        $this->authorize('viewAny', Court::class);

        return Inertia::render('courts/index', [
            'courts' => $this->courtRepository->paginate(),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Court::class);

        return Inertia::render('courts/create');
    }

    public function store(StoreCourtRequest $request): RedirectResponse
    {
        $court = $this->courtRepository->create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Court created.')]);

        return to_route('courts.edit', $court);
    }

    public function edit(Court $court): Response
    {
        $this->authorize('update', $court);

        $court->load('club');

        return Inertia::render('courts/edit', [
            'court' => $court,
        ]);
    }

    public function update(UpdateCourtRequest $request, Court $court): RedirectResponse
    {
        $this->courtRepository->update($court, $request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Court updated.')]);

        return to_route('courts.edit', $court);
    }

    public function destroy(Court $court): RedirectResponse
    {
        $this->authorize('delete', $court);

        $this->courtRepository->delete($court);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Court deleted.')]);

        return to_route('courts.index');
    }
}
