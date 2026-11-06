<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Services\Messenger\MessengerConnectionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MessengerController extends Controller
{
    public function __construct(
        private readonly MessengerConnectionService $connections,
    ) {}

    public function edit(Request $request): Response
    {
        return Inertia::render('settings/messenger', [
            'messenger' => $this->connections->status($request->user()),
        ]);
    }

    /**
     * Sends the browser on to Messenger with a fresh one-time link. A plain
     * redirect, not an Inertia visit: m.me hands off to the Messenger app.
     */
    public function connect(Request $request): RedirectResponse
    {
        $url = $this->connections->connectUrl($request->user());

        return $url !== null ? redirect()->away($url) : to_route('messenger.edit');
    }

    public function test(Request $request): RedirectResponse
    {
        $sent = $this->connections->sendTest($request->user());

        Inertia::flash('toast', $sent
            ? ['type' => 'success', 'message' => __('Test message sent. Check Messenger.')]
            : ['type' => 'error', 'message' => __('Could not send a test message. Send any message to our Page in Messenger, then try again.')]);

        return to_route('messenger.edit');
    }

    public function destroy(Request $request): RedirectResponse
    {
        $this->connections->disconnect($request->user());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Messenger disconnected.')]);

        return to_route('messenger.edit');
    }
}
