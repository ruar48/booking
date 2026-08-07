<?php

namespace App\Http\Controllers;

use App\Enums\PaymentStatus;
use App\Models\OpenPlaySession;
use App\Models\OpenPlayRegistration;
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

    public function store(Request $request, OpenPlaySession $open_play): RedirectResponse
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

    public function addAll(Request $request, OpenPlaySession $open_play): RedirectResponse
    {
        $this->authorize('update', $open_play);

        $registered = $this->registrationService->registerAll($open_play, $request->user()->id);

        Inertia::flash('toast', [
            'type' => $registered > 0 ? 'success' : 'error',
            'message' => $registered > 0
                ? __(':count :player added.', ['count' => $registered, 'player' => $registered === 1 ? 'player' : 'players'])
                : __('No eligible players to add.'),
        ]);

        return back();
    }

    public function pairRandom(OpenPlaySession $open_play): RedirectResponse
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

    public function destroy(OpenPlayRegistration $registration): RedirectResponse
    {
        $this->authorize('update', $registration->openPlaySession);

        $registration->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Registration removed.')]);

        return back();
    }

    public function updatePayment(Request $request, OpenPlayRegistration $registration): RedirectResponse
    {
        $this->authorize('update', $registration->openPlaySession);

        $validated = $request->validate([
            'payment_status' => ['required', 'string', 'in:unpaid,paid'],
        ]);

        $registration->update(['payment_status' => PaymentStatus::from($validated['payment_status'])]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $validated['payment_status'] === 'paid'
                ? __('Marked as paid.')
                : __('Marked as unpaid.'),
        ]);

        return back();
    }
}
