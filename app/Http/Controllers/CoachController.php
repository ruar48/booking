<?php

namespace App\Http\Controllers;

use App\Models\Coach;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CoachController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Coach::class);

        $coaches = Coach::query()
            ->with(['user', 'club'])
            ->when(
                $request->filled('club_id'),
                fn ($query) => $query->where('club_id', $request->integer('club_id')),
            )
            ->where('is_active', true)
            ->latest()
            ->paginate();

        return Inertia::render('coaches/index', [
            'coaches' => $coaches,
            'filters' => $request->only(['club_id']),
        ]);
    }

    public function show(Coach $coach): Response
    {
        $this->authorize('view', $coach);

        $coach->load(['user', 'club', 'players.user', 'trainingSessions']);

        return Inertia::render('coaches/show', [
            'coach' => $coach,
        ]);
    }
}
