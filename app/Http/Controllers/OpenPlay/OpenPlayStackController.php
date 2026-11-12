<?php

namespace App\Http\Controllers\OpenPlay;

use App\Exceptions\OpenPlayStackException;
use App\Http\Controllers\Controller;
use App\Http\Requests\OpenPlay\StackOpenPlayPlayerRequest;
use App\Models\OpenPlaySession;
use App\Models\OpenPlayStackEntry;
use App\Models\Player;
use App\Models\Resource;
use App\Services\OpenPlayStackService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

/**
 * Staff running a paddle-stacking session from the manage page.
 */
class OpenPlayStackController extends Controller
{
    public function __construct(
        private readonly OpenPlayStackService $stackService,
    ) {}

    public function store(StackOpenPlayPlayerRequest $request, OpenPlaySession $open_play): RedirectResponse
    {
        $player = Player::query()->findOrFail($request->integer('player_id'));

        return $this->attempt(
            fn () => $this->stackService->stack($open_play, $player),
            __('Paddle stacked.'),
        );
    }

    public function storeEveryone(OpenPlaySession $open_play): RedirectResponse
    {
        $this->authorize('update', $open_play);

        try {
            $stacked = $this->stackService->stackEveryone($open_play);
        } catch (OpenPlayStackException $e) {
            Inertia::flash('toast', ['type' => 'error', 'message' => $e->getMessage()]);

            return back();
        }

        Inertia::flash('toast', [
            'type' => $stacked > 0 ? 'success' : 'error',
            'message' => $stacked > 0
                ? trans_choice(':count paddle stacked.|:count paddles stacked.', $stacked, ['count' => $stacked])
                : __('Every paid player is already in the stack.'),
        ]);

        return back();
    }

    public function destroy(OpenPlaySession $open_play, OpenPlayStackEntry $stackEntry): RedirectResponse
    {
        $this->authorize('update', $open_play);

        return $this->attempt(
            fn () => $this->stackService->sitOut($open_play, $stackEntry),
            __('Player is sitting out.'),
        );
    }

    public function finish(OpenPlaySession $open_play, Resource $resource): RedirectResponse
    {
        $this->authorize('update', $open_play);

        return $this->attempt(
            fn () => $this->stackService->finishGame($open_play, $resource),
            __(':court is free — next group called.', ['court' => $resource->name]),
        );
    }

    private function attempt(callable $change, string $success): RedirectResponse
    {
        try {
            $change();
        } catch (OpenPlayStackException $e) {
            Inertia::flash('toast', ['type' => 'error', 'message' => $e->getMessage()]);

            return back();
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => $success]);

        return back();
    }
}
