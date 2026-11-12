<?php

namespace App\Http\Controllers\OpenPlay;

use App\Exceptions\OpenPlayStackException;
use App\Http\Controllers\Controller;
use App\Models\OpenPlaySession;
use App\Services\OpenPlayStackService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * A registered player stacking or pulling their own paddle from their phone.
 * The player is always resolved from the signed-in user, never the request.
 */
class OpenPlayMyStackController extends Controller
{
    public function __construct(
        private readonly OpenPlayStackService $stackService,
    ) {}

    public function store(Request $request, OpenPlaySession $open_play): RedirectResponse
    {
        $this->authorize('stackOwnPaddle', $open_play);

        try {
            $this->stackService->stackSelf($open_play, $request->user());
        } catch (OpenPlayStackException $e) {
            Inertia::flash('toast', ['type' => 'error', 'message' => $e->getMessage()]);

            return back();
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __("Your paddle is stacked — we'll show you when you're up.")]);

        return back();
    }

    public function destroy(Request $request, OpenPlaySession $open_play): RedirectResponse
    {
        $this->authorize('stackOwnPaddle', $open_play);

        try {
            $this->stackService->sitOutSelf($open_play, $request->user());
        } catch (OpenPlayStackException $e) {
            Inertia::flash('toast', ['type' => 'error', 'message' => $e->getMessage()]);

            return back();
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('You are sitting out. Stack your paddle again when you are ready.')]);

        return back();
    }
}
