<?php

namespace App\Http\Controllers\OpenPlay;

use App\Http\Controllers\Controller;
use App\Models\OpenPlaySession;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OpenPlayTargetScoreController extends Controller
{
    public function update(Request $request, OpenPlaySession $open_play): RedirectResponse
    {
        $this->authorize('update', $open_play);

        $validated = $request->validate([
            'target_score' => ['required', 'integer', 'min:1', 'max:99'],
        ]);

        $open_play->update($validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Target score updated.')]);

        return back();
    }
}
