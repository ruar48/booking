<?php

namespace App\Http\Controllers;

use App\Contracts\Repositories\PlayerRepositoryInterface;
use App\Http\Requests\StorePlayerRequest;
use App\Http\Requests\UpdatePlayerRequest;
use App\Models\Player;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PlayerController extends Controller
{
    public function __construct(
        private readonly PlayerRepositoryInterface $playerRepository,
    ) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Player::class);

        return Inertia::render('players/index', [
            'players' => $this->playerRepository->paginate($request->only(['search', 'club_id', 'experience_level'])),
            'filters' => $request->only(['search', 'club_id', 'experience_level']),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Player::class);

        return Inertia::render('players/create');
    }

    public function store(StorePlayerRequest $request): RedirectResponse
    {
        $player = $this->playerRepository->create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Player created.')]);

        return to_route('players.show', $player);
    }

    public function show(Player $player): Response
    {
        $this->authorize('view', $player);

        $player = $this->playerRepository->findWithRelations($player->id);

        return Inertia::render('players/show', [
            'player' => $player,
        ]);
    }

    public function edit(Player $player): Response
    {
        $this->authorize('update', $player);

        $player->load(['user', 'club']);

        return Inertia::render('players/edit', [
            'player' => $player,
        ]);
    }

    public function update(UpdatePlayerRequest $request, Player $player): RedirectResponse
    {
        $this->playerRepository->update($player, $request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Player updated.')]);

        return to_route('players.show', $player);
    }

    public function destroy(Player $player): RedirectResponse
    {
        $this->authorize('delete', $player);

        $this->playerRepository->delete($player);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Player deleted.')]);

        return to_route('players.index');
    }
}
