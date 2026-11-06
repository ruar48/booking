<?php

namespace App\Http\Middleware;

use App\Integrations\Meta\MessengerClient;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Rejects any webhook delivery that Meta did not sign with the app secret.
 * Without it, anyone could post a fake referral and attach their own
 * Messenger to a stranger's account.
 */
class VerifyMessengerSignature
{
    public function __construct(
        private readonly MessengerClient $client,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        if (! $this->client->hasValidSignature($request->getContent(), $request->header('X-Hub-Signature-256'))) {
            Log::warning('messenger.webhook.invalid_signature', [
                'ip' => $request->ip(),
                'has_signature_header' => $request->hasHeader('X-Hub-Signature-256'),
                'app_secret_configured' => filled(config('services.messenger.app_secret')),
            ]);

            return response('Invalid signature', 403);
        }

        return $next($request);
    }
}
