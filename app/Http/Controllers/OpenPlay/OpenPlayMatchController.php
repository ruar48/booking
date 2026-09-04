<?php

namespace App\Http\Controllers\OpenPlay;

use App\Enums\MatchStatus;
use App\Http\Controllers\Controller;
use App\Models\OpenPlayMatch;
use App\Services\OpenPlayBracketService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class OpenPlayMatchController extends Controller
{
    public function __construct(
        private readonly OpenPlayBracketService $bracketService,
    ) {}

    public function updateScore(Request $request, OpenPlayMatch $match): RedirectResponse
    {
        $this->authorize('update', $match->openPlaySession);

        abort_if($match->entry1_id === null || $match->entry2_id === null, 422, 'Both entries must be known before a score can be recorded.');

        $validated = $request->validate([
            'entry1_score' => ['required', 'integer', 'min:0', 'max:99', 'different:entry2_score'],
            'entry2_score' => ['required', 'integer', 'min:0', 'max:99'],
        ]);

        $targetScore = $match->openPlaySession->target_score;

        if (max($validated['entry1_score'], $validated['entry2_score']) !== $targetScore) {
            throw ValidationException::withMessages([
                'entry1_score' => "The winning entry must score exactly {$targetScore} points to win.",
            ]);
        }

        $winnerRegistrationId = $validated['entry1_score'] > $validated['entry2_score']
            ? $match->entry1_id
            : $match->entry2_id;

        $match->update([
            ...$validated,
            'winner_registration_id' => $winnerRegistrationId,
            'status' => MatchStatus::Completed,
        ]);

        $this->bracketService->advanceWinner($match);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Score saved.')]);

        return back();
    }
}
