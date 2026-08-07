<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreOpenPlayRequest;
use App\Http\Requests\UpdateOpenPlayRequest;
use App\Models\OpenPlaySession;
use App\Models\Player;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OpenPlayController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', OpenPlaySession::class);

        $search = $request->string('search')->value() ?: null;
        $status = $request->string('status')->value() ?: null;
        $bracketFormat = $request->string('bracket_format')->value() ?: null;
        $dateFrom = $request->string('date_from')->value() ?: null;
        $dateTo = $request->string('date_to')->value() ?: null;
        $sort = $request->string('sort')->value() === 'latest' ? 'latest' : 'upcoming';

        $sessions = OpenPlaySession::query()
            ->when($search !== null, fn ($query) => $query->where('title', 'like', "%{$search}%"))
            ->when($status === 'upcoming', fn ($query) => $query->where('starts_at', '>=', now()))
            ->when($status === 'past', fn ($query) => $query->where('starts_at', '<', now()))
            ->when($bracketFormat !== null, fn ($query) => $query->where('bracket_format', $bracketFormat))
            ->when($dateFrom !== null, fn ($query) => $query->whereDate('starts_at', '>=', $dateFrom))
            ->when($dateTo !== null, fn ($query) => $query->whereDate('starts_at', '<=', $dateTo))
            ->withCount('registrations')
            ->when(
                $sort === 'latest',
                fn ($query) => $query->orderByDesc('starts_at'),
                fn ($query) => $query->orderBy('starts_at'),
            )
            ->paginate(15)
            ->withQueryString();

        $upcomingCount = OpenPlaySession::query()
            ->where('starts_at', '>=', now())
            ->count();

        return Inertia::render('open-play/index', [
            'sessions' => $sessions,
            'upcomingCount' => $upcomingCount,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'bracket_format' => $bracketFormat,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'sort' => $sort,
            ],
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', OpenPlaySession::class);

        return Inertia::render('open-play/create');
    }

    public function store(StoreOpenPlayRequest $request): RedirectResponse
    {
        $session = OpenPlaySession::query()->create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Open play session created.')]);

        return to_route('open-play.edit', $session);
    }

    public function edit(OpenPlaySession $open_play): Response
    {
        $this->authorize('update', $open_play);

        return Inertia::render('open-play/edit', [
            'session' => $open_play,
        ]);
    }

    public function update(UpdateOpenPlayRequest $request, OpenPlaySession $open_play): RedirectResponse
    {
        $open_play->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Open play session updated.')]);

        return to_route('open-play.edit', $open_play);
    }

    public function destroy(OpenPlaySession $open_play): RedirectResponse
    {
        $this->authorize('delete', $open_play);

        $open_play->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Open play session deleted.')]);

        return to_route('open-play.index');
    }

    public function manage(OpenPlaySession $open_play): Response
    {
        $this->authorize('update', $open_play);

        $open_play->load([
            'registrations.player.user:id,name',
            'registrations.partner.user:id,name',
            'matches' => fn ($query) => $query->orderBy('round')->orderBy('bracket_position'),
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
