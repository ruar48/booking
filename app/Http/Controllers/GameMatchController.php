<?php

namespace App\Http\Controllers;

use App\Contracts\Repositories\GameMatchRepositoryInterface;
use App\Enums\MatchStatus;
use App\Models\GameMatch;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GameMatchController extends Controller
{
    public function __construct(
        private readonly GameMatchRepositoryInterface $gameMatchRepository,
    ) {}

    public function index(): Response
    {
        $this->authorize('viewAny', GameMatch::class);

        return Inertia::render('matches/index', [
            'matches' => $this->gameMatchRepository->paginate(),
        ]);
    }

    public function show(GameMatch $match): Response
    {
        $this->authorize('view', $match);

        $match->load(['tournament', 'court', 'player1.user', 'player2.user', 'winner', 'sets', 'referee']);

        return Inertia::render('matches/show', [
            'match' => $match,
        ]);
    }

    public function updateScore(Request $request, GameMatch $match): RedirectResponse
    {
        $this->authorize('updateScore', $match);

        $validated = $request->validate([
            'sets' => ['required', 'array', 'min:1'],
            'sets.*.set_number' => ['required', 'integer', 'min:1'],
            'sets.*.player1_score' => ['required', 'integer', 'min:0'],
            'sets.*.player2_score' => ['required', 'integer', 'min:0'],
        ]);

        foreach ($validated['sets'] as $setData) {
            $match->sets()->updateOrCreate(
                ['set_number' => $setData['set_number']],
                [
                    'player1_score' => $setData['player1_score'],
                    'player2_score' => $setData['player2_score'],
                ],
            );
        }

        if ($match->status === MatchStatus::Scheduled) {
            $this->gameMatchRepository->update($match, [
                'status' => MatchStatus::InProgress,
                'started_at' => now(),
            ]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Score updated.')]);

        return to_route('matches.show', $match);
    }

    public function complete(Request $request, GameMatch $match): RedirectResponse
    {
        $this->authorize('complete', $match);

        $validated = $request->validate([
            'winner_id' => ['required', 'integer', 'exists:players,id'],
            'result_type' => ['nullable', 'string', 'max:50'],
        ]);

        $this->gameMatchRepository->update($match, [
            'winner_id' => $validated['winner_id'],
            'result_type' => $validated['result_type'] ?? null,
            'status' => MatchStatus::Completed,
            'completed_at' => now(),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Match completed.')]);

        return to_route('matches.show', $match);
    }
}
