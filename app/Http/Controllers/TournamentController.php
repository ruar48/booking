<?php

namespace App\Http\Controllers;

use App\Contracts\Repositories\TournamentRepositoryInterface;
use App\Enums\TournamentStatus;
use App\Http\Requests\StoreTournamentRequest;
use App\Http\Requests\UpdateTournamentRequest;
use App\Models\Tournament;
use App\Models\TournamentRegistration;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TournamentController extends Controller
{
    public function __construct(
        private readonly TournamentRepositoryInterface $tournamentRepository,
    ) {}

    public function index(): Response
    {
        $this->authorize('viewAny', Tournament::class);

        return Inertia::render('tournaments/index', [
            'tournaments' => $this->tournamentRepository->paginate(),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Tournament::class);

        return Inertia::render('tournaments/create');
    }

    public function store(StoreTournamentRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['created_by'] = $request->user()->id;
        $data['status'] = TournamentStatus::Draft;

        $tournament = $this->tournamentRepository->create($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Tournament created.')]);

        return to_route('tournaments.show', $tournament);
    }

    public function show(Tournament $tournament): Response
    {
        $this->authorize('view', $tournament);

        $tournament->load(['creator', 'categories', 'registrations.player.user']);

        return Inertia::render('tournaments/show', [
            'tournament' => $tournament,
        ]);
    }

    public function edit(Tournament $tournament): Response
    {
        $this->authorize('update', $tournament);

        return Inertia::render('tournaments/edit', [
            'tournament' => $tournament,
        ]);
    }

    public function update(UpdateTournamentRequest $request, Tournament $tournament): RedirectResponse
    {
        $this->tournamentRepository->update($tournament, $request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Tournament updated.')]);

        return to_route('tournaments.show', $tournament);
    }

    public function destroy(Tournament $tournament): RedirectResponse
    {
        $this->authorize('delete', $tournament);

        $this->tournamentRepository->delete($tournament);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Tournament deleted.')]);

        return to_route('tournaments.index');
    }

    public function register(Request $request, Tournament $tournament): RedirectResponse
    {
        $this->authorize('register', $tournament);

        $player = $request->user()->players()->firstOrFail();

        TournamentRegistration::query()->firstOrCreate(
            [
                'tournament_id' => $tournament->id,
                'player_id' => $player->id,
            ],
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Registered for tournament.')]);

        return to_route('tournaments.show', $tournament);
    }

    public function generateBracket(Tournament $tournament): RedirectResponse
    {
        $this->authorize('generateBracket', $tournament);

        $this->tournamentRepository->update($tournament, [
            'status' => TournamentStatus::InProgress,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Bracket generation started.')]);

        return to_route('tournaments.show', $tournament);
    }
}
