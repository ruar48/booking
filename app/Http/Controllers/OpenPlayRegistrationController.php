<?php

namespace App\Http\Controllers;

use App\Models\ClubEvent;
use App\Models\ClubEventRegistration;
use App\Models\Player;
use App\Services\OpenPlayRegistrationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OpenPlayRegistrationController extends Controller
{
    public function __construct(
        private readonly OpenPlayRegistrationService $registrationService,
    ) {}

    public function store(Request $request, ClubEvent $open_play): RedirectResponse
    {
        $this->authorize('update', $open_play);

        $validated = $request->validate([
            'player_id' => ['required', 'integer', 'exists:players,id'],
            'partner_player_id' => ['nullable', 'integer', 'exists:players,id', 'different:player_id'],
        ]);

        $player = Player::query()->findOrFail($validated['player_id']);
        $partner = isset($validated['partner_player_id'])
            ? Player::query()->findOrFail($validated['partner_player_id'])
            : null;

        $error = $this->registrationService->register($open_play, $player, $partner, $request->user()->id);

        if ($error !== null) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __($error)]);

            return back();
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Player registered.')]);

        return back();
    }

    public function pairRandom(ClubEvent $open_play): RedirectResponse
    {
        $this->authorize('update', $open_play);

        $pairsFormed = $this->registrationService->pairRandomly($open_play);

        Inertia::flash('toast', [
            'type' => $pairsFormed > 0 ? 'success' : 'error',
            'message' => $pairsFormed > 0
                ? __(':count random :pair formed.', ['count' => $pairsFormed, 'pair' => $pairsFormed === 1 ? 'pair' : 'pairs'])
                : __('No unpaired players to match up.'),
        ]);

        return back();
    }

    public function destroy(ClubEventRegistration $registration): RedirectResponse
    {
        $this->authorize('update', $registration->clubEvent);

        $registration->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Registration removed.')]);

        return back();
    }
}
