<?php

namespace App\Http\Controllers;

use App\Services\Messenger\MessengerWebhookProcessor;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;
use Throwable;

class MessengerWebhookController extends Controller
{
    public function __construct(
        private readonly MessengerWebhookProcessor $processor,
    ) {}

    /**
     * Meta's one-time handshake when the webhook URL is saved in the app
     * dashboard. PHP turns the `hub.mode` query keys into `hub_mode`.
     */
    public function verify(Request $request): Response
    {
        $expected = (string) config('services.messenger.verify_token');

        if ($expected !== ''
            && $request->query('hub_mode') === 'subscribe'
            && hash_equals($expected, (string) $request->query('hub_verify_token'))) {
            return response((string) $request->query('hub_challenge'), 200);
        }

        return response('Forbidden', 403);
    }

    /**
     * Always answers 200 once the signature checks out. Meta disables a
     * webhook that keeps failing, so a bad event is logged, never bounced.
     */
    public function handle(Request $request): Response
    {
        try {
            $this->processor->handle($request->json()->all());
        } catch (Throwable $e) {
            Log::error('messenger.webhook.failed', ['error' => $e->getMessage()]);
            report($e);
        }

        return response('EVENT_RECEIVED', 200);
    }
}
