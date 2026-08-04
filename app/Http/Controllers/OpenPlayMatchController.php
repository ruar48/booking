<?php

namespace App\Http\Controllers;

use App\Enums\MatchStatus;
use App\Models\ClubEventMatch;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OpenPlayMatchController extends Controller
{
    public function updateScore(Request $request, ClubEventMatch $match): RedirectResponse
    {
        $this->authorize('update', $match->clubEvent);

        $validated = $request->validate([
            'entry1_score' => ['required', 'integer', 'min:0', 'max:99', 'different:entry2_score'],
            'entry2_score' => ['required', 'integer', 'min:0', 'max:99'],
        ]);

        $winnerRegistrationId = $validated['entry1_score'] > $validated['entry2_score']
            ? $match->entry1_id
            : $match->entry2_id;

        $match->update([
            ...$validated,
            'winner_registration_id' => $winnerRegistrationId,
            'status' => MatchStatus::Completed,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Score saved.')]);

        return back();
    }
}
