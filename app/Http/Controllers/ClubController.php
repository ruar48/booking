<?php

namespace App\Http\Controllers;

use App\Contracts\Repositories\ClubRepositoryInterface;
use App\Http\Requests\StoreClubRequest;
use App\Http\Requests\UpdateClubRequest;
use App\Models\Club;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ClubController extends Controller
{
    public function __construct(
        private readonly ClubRepositoryInterface $clubRepository,
    ) {}

    public function index(): Response
    {
        $this->authorize('viewAny', Club::class);

        return Inertia::render('clubs/index', [
            'clubs' => $this->clubRepository->paginate(),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Club::class);

        return Inertia::render('clubs/create');
    }

    public function store(StoreClubRequest $request): RedirectResponse
    {
        $club = $this->clubRepository->create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Club created.')]);

        return to_route('clubs.show', $club);
    }

    public function show(Club $club): Response
    {
        $this->authorize('view', $club);

        $club->loadCount(['courts', 'players', 'tournaments', 'coaches']);

        return Inertia::render('clubs/show', [
            'club' => $club,
        ]);
    }

    public function edit(Club $club): Response
    {
        $this->authorize('update', $club);

        return Inertia::render('clubs/edit', [
            'club' => $club,
        ]);
    }

    public function update(UpdateClubRequest $request, Club $club): RedirectResponse
    {
        $this->clubRepository->update($club, $request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Club updated.')]);

        return to_route('clubs.show', $club);
    }

    public function destroy(Club $club): RedirectResponse
    {
        $this->authorize('delete', $club);

        $this->clubRepository->delete($club);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Club deleted.')]);

        return to_route('clubs.index');
    }
}
