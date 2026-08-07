<?php

namespace App\Http\Controllers;

use App\Models\OpenPlaySession;
use App\Models\OpenPlayMatch;
use App\Models\OpenPlayRegistration;
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

    public function store(Request $request, OpenPlaySession $open_play): RedirectResponse
    {
        $this->authorize('update', $open_play);

        $validated = $request->validate([
            'entry1_id' => [
                'required',
                'integer',
                'different:entry2_id',
                Rule::exists('open_play_registrations', 'id')->where('open_play_session_id', $open_play->id),
            ],
            'entry2_id' => [
                'required',
                'integer',
                Rule::exists('open_play_registrations', 'id')->where('open_play_session_id', $open_play->id),
            ],
        ]);

        $entry1 = OpenPlayRegistration::query()->findOrFail($validated['entry1_id']);
        $entry2 = OpenPlayRegistration::query()->findOrFail($validated['entry2_id']);

        $error = $this->bracketService->addManualMatch($open_play, $entry1, $entry2);

        if ($error !== null) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __($error)]);

            return back();
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Matchup added.')]);

        return back();
    }

    public function destroy(OpenPlayMatch $match): RedirectResponse
    {
        $this->authorize('update', $match->openPlaySession);

        $match->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Matchup removed.')]);

        return back();
    }
}
