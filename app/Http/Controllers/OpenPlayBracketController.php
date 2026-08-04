<?php

namespace App\Http\Controllers;

use App\Models\ClubEvent;
use App\Services\OpenPlayBracketService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

class OpenPlayBracketController extends Controller
{
    public function __construct(
        private readonly OpenPlayBracketService $bracketService,
    ) {}

    public function generate(ClubEvent $open_play): RedirectResponse
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

    public function reset(ClubEvent $open_play): RedirectResponse
    {
        $this->authorize('update', $open_play);

        $open_play->matches()->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Bracket reset.')]);

        return back();
    }
}
