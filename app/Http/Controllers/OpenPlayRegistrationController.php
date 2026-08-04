<?php

namespace App\Http\Controllers;

use App\Models\ClubEvent;
use App\Models\ClubEventRegistration;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class OpenPlayRegistrationController extends Controller
{
    public function store(Request $request, ClubEvent $open_play): RedirectResponse
    {
        $this->authorize('update', $open_play);

        $validated = $request->validate([
            'player_id' => [
                'required',
                'integer',
                'exists:players,id',
                Rule::unique('club_event_registrations', 'player_id')
                    ->where('club_event_id', $open_play->id),
            ],
            'partner_player_id' => ['nullable', 'integer', 'exists:players,id', 'different:player_id'],
        ]);

        ClubEventRegistration::query()->create([
            ...$validated,
            'club_event_id' => $open_play->id,
            'created_by' => $request->user()->id,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Player registered.')]);

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
