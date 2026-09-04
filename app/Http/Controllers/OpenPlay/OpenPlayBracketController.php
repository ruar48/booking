<?php

namespace App\Http\Controllers\OpenPlay;

use App\Http\Controllers\Controller;
use App\Models\OpenPlaySession;
use App\Services\OpenPlayBracketService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OpenPlayBracketController extends Controller
{
    public function __construct(
        private readonly OpenPlayBracketService $bracketService,
    ) {}

    public function generate(OpenPlaySession $open_play): RedirectResponse
    {
        $this->authorize('update', $open_play);

        $error = $this->bracketService->generate($open_play);

        if ($error !== null) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __($error)]);

            return back();
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Bracket generated.')]);

        return back();
    }

    public function reset(OpenPlaySession $open_play): RedirectResponse
    {
        $this->authorize('update', $open_play);

        $open_play->matches()->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Bracket reset.')]);

        return back();
    }

    public function updateVisibility(Request $request, OpenPlaySession $open_play): RedirectResponse
    {
        $this->authorize('update', $open_play);

        $validated = $request->validate([
            'visible' => ['required', 'boolean'],
        ]);

        $open_play->update(['bracket_visible' => $validated['visible']]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $validated['visible']
                ? __('Bracket is now visible to players.')
                : __('Bracket is now hidden from players.'),
        ]);

        return back();
    }
}
