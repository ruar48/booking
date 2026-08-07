<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTrainingSessionRequest;
use App\Models\TrainingSession;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TrainingSessionController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', TrainingSession::class);

        $sessions = TrainingSession::query()
            ->with(['coach.user', 'court'])
            ->latest('scheduled_at')
            ->paginate();

        return Inertia::render('training-sessions/index', [
            'sessions' => $sessions,
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', TrainingSession::class);

        return Inertia::render('training-sessions/create');
    }

    public function store(StoreTrainingSessionRequest $request): RedirectResponse
    {
        $session = TrainingSession::query()->create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Training session created.')]);

        return to_route('training-sessions.show', $session);
    }

    public function show(TrainingSession $trainingSession): Response
    {
        $this->authorize('view', $trainingSession);

        $trainingSession->load(['coach.user', 'court', 'attendance.player.user', 'drills']);

        return Inertia::render('training-sessions/show', [
            'session' => $trainingSession,
        ]);
    }
}
