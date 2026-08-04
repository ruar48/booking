<?php

namespace App\Http\Controllers;

use App\Enums\MatchStatus;
use App\Models\ClubEvent;
use App\Models\ClubEventMatch;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

class OpenPlayBracketController extends Controller
{
    public function generate(ClubEvent $open_play): RedirectResponse
    {
        $this->authorize('update', $open_play);

        if ($open_play->matches()->exists()) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('Bracket already generated. Reset it first.')]);

            return back();
        }

        $registrationIds = $open_play->registrations()->pluck('id')->values();

        if ($registrationIds->count() < 2) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('Register at least 2 players/teams first.')]);

            return back();
        }

        $now = now();
        $matches = [];

        for ($i = 0; $i < $registrationIds->count(); $i++) {
            for ($j = $i + 1; $j < $registrationIds->count(); $j++) {
                $matches[] = [
                    'club_event_id' => $open_play->id,
                    'entry1_id' => $registrationIds[$i],
                    'entry2_id' => $registrationIds[$j],
                    'status' => MatchStatus::Scheduled->value,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        ClubEventMatch::query()->insert($matches);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Round robin bracket generated.')]);

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
