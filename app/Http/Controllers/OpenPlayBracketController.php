<?php

namespace App\Http\Controllers;

use App\Enums\TournamentFormat;
use App\Models\ClubEvent;
use App\Services\OpenPlayBracketService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Enum;
use Inertia\Inertia;

class OpenPlayBracketController extends Controller
{
    public function __construct(
        private readonly OpenPlayBracketService $bracketService,
    ) {}

    public function generate(Request $request, ClubEvent $open_play): RedirectResponse
    {
        $this->authorize('update', $open_play);

        $validated = $request->validate([
            'format' => ['required', new Enum(TournamentFormat::class), 'not_in:double_elimination'],
        ]);

        $error = $this->bracketService->generate($open_play, TournamentFormat::from($validated['format']));

        if ($error !== null) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __($error)]);

            return back();
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Bracket generated.')]);

        return back();
    }

    public function reset(ClubEvent $open_play): RedirectResponse
    {
        $this->authorize('update', $open_play);

        $open_play->matches()->delete();
        $open_play->update(['bracket_format' => null]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Bracket reset.')]);

        return back();
    }
}
