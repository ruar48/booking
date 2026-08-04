<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreOpenPlayRequest;
use App\Http\Requests\UpdateOpenPlayRequest;
use App\Models\Club;
use App\Models\ClubEvent;
use App\Models\Player;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OpenPlayController extends Controller
{
    public function index(): Response
    {
        $this->authorize('viewAny', ClubEvent::class);

        $clubId = Club::query()->where('is_active', true)->oldest()->value('id');

        $sessions = ClubEvent::query()
            ->when($clubId !== null, fn ($query) => $query->where('club_id', $clubId))
            ->withCount('registrations')
            ->orderBy('starts_at')
            ->paginate(15);

        $upcomingCount = ClubEvent::query()
            ->when($clubId !== null, fn ($query) => $query->where('club_id', $clubId))
            ->where('starts_at', '>=', now())
            ->count();

        return Inertia::render('open-play/index', [
            'sessions' => $sessions,
            'upcomingCount' => $upcomingCount,
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', ClubEvent::class);

        $club = Club::query()->where('is_active', true)->oldest()->first();

        return Inertia::render('open-play/create', [
            'club' => $club,
        ]);
    }

    public function store(StoreOpenPlayRequest $request): RedirectResponse
    {
        $session = ClubEvent::query()->create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Open play session created.')]);

        return to_route('open-play.edit', $session);
    }

    public function edit(ClubEvent $open_play): Response
    {
        $this->authorize('update', $open_play);

        return Inertia::render('open-play/edit', [
            'session' => $open_play,
        ]);
    }

    public function update(UpdateOpenPlayRequest $request, ClubEvent $open_play): RedirectResponse
    {
        $open_play->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Open play session updated.')]);

        return to_route('open-play.edit', $open_play);
    }

    public function destroy(ClubEvent $open_play): RedirectResponse
    {
        $this->authorize('delete', $open_play);

        $open_play->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Open play session deleted.')]);

        return to_route('open-play.index');
    }

    public function manage(ClubEvent $open_play): Response
    {
        $this->authorize('update', $open_play);

        $open_play->load([
            'registrations.player.user:id,name',
            'registrations.partner.user:id,name',
            'matches.entry1.player.user:id,name',
            'matches.entry1.partner.user:id,name',
            'matches.entry2.player.user:id,name',
            'matches.entry2.partner.user:id,name',
        ]);

        return Inertia::render('open-play/manage', [
            'session' => $open_play,
        ]);
    }

    public function search(Request $request): JsonResponse
    {
        $request->validate(['q' => ['required', 'string', 'min:2']]);

        $q = $request->string('q')->toString();

        $players = Player::query()
            ->whereHas('user', fn ($query) => $query->where('name', 'like', "%{$q}%"))
            ->with('user:id,name')
            ->limit(10)
            ->get(['id', 'user_id']);

        return response()->json($players);
    }
}
