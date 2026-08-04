<?php

namespace App\Http\Controllers;

use App\Models\ClubEvent;
use App\Models\ClubEventMatch;
use App\Models\ClubEventRegistration;
use App\Services\OpenPlayBracketService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class OpenPlayBracketMatchController extends Controller
{
    public function __construct(
        private readonly OpenPlayBracketService $bracketService,
    ) {}

    public function store(Request $request, ClubEvent $open_play): RedirectResponse
    {
        $this->authorize('update', $open_play);

        $validated = $request->validate([
            'entry1_id' => [
                'required',
                'integer',
                'different:entry2_id',
                Rule::exists('club_event_registrations', 'id')->where('club_event_id', $open_play->id),
            ],
            'entry2_id' => [
                'required',
                'integer',
                Rule::exists('club_event_registrations', 'id')->where('club_event_id', $open_play->id),
            ],
        ]);

        $entry1 = ClubEventRegistration::query()->findOrFail($validated['entry1_id']);
        $entry2 = ClubEventRegistration::query()->findOrFail($validated['entry2_id']);

        $error = $this->bracketService->addManualMatch($open_play, $entry1, $entry2);

        if ($error !== null) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __($error)]);

            return back();
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Matchup added.')]);

        return back();
    }

    public function destroy(ClubEventMatch $match): RedirectResponse
    {
        $this->authorize('update', $match->clubEvent);

        $match->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Matchup removed.')]);

        return back();
    }
}
