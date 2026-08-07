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
            ->with(['user'])
            ->where('is_active', true)
            ->latest()
            ->paginate();

        return Inertia::render('coaches/index', [
            'coaches' => $coaches,
        ]);
    }

    public function show(Coach $coach): Response
    {
        $this->authorize('view', $coach);

        $coach->load(['user', 'players.user', 'trainingSessions']);

        return Inertia::render('coaches/show', [
            'coach' => $coach,
        ]);
    }
}
