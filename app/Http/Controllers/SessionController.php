<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SessionController extends Controller
{
    public function index(Request $request): Response
    {
        $currentSessionId = $request->session()->getId();

        $sessions = DB::table('sessions')
            ->where('user_id', $request->user()->id)
            ->orderByDesc('last_activity')
            ->get()
            ->map(fn ($session) => [
                'id' => $session->id,
                'ip_address' => $session->ip_address,
                'user_agent' => $session->user_agent,
                'device' => $this->parseDevice($session->user_agent),
                'last_active_at' => Carbon::createFromTimestamp($session->last_activity)->toIso8601String(),
                'is_current_device' => $session->id === $currentSessionId,
            ])
            ->values()
            ->all();

        return Inertia::render('settings/sessions', [
            'sessions' => $sessions,
        ]);
    }

    public function destroy(Request $request, string $session): RedirectResponse
    {
        $deleted = DB::table('sessions')
            ->where('id', $session)
            ->where('user_id', $request->user()->id)
            ->where('id', '!=', $request->session()->getId())
            ->delete();

        if ($deleted === 0) {
            abort(404);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Session revoked.')]);

        return back();
    }

    private function parseDevice(?string $userAgent): string
    {
        if ($userAgent === null) {
            return 'unknown';
        }

        $userAgent = strtolower($userAgent);

        if (str_contains($userAgent, 'iphone') || str_contains($userAgent, 'ipad')) {
            return 'iOS';
        }

        if (str_contains($userAgent, 'android')) {
            return 'Android';
        }

        if (str_contains($userAgent, 'windows')) {
            return 'Windows';
        }

        if (str_contains($userAgent, 'macintosh') || str_contains($userAgent, 'mac os')) {
            return 'macOS';
        }

        if (str_contains($userAgent, 'linux')) {
            return 'Linux';
        }

        return 'unknown';
    }
}
