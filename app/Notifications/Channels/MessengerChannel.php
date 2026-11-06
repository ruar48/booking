<?php

namespace App\Notifications\Channels;

use App\Integrations\Meta\MessengerClient;
use App\Integrations\Meta\MessengerException;
use App\Models\User;
use App\Notifications\Messages\MessengerMessage;
use App\Services\MessengerConnectionService;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;

/**
 * Delivers a notification to the recipient's Facebook Messenger, when they
 * have connected it. Anyone who hasn't is skipped silently — Messenger is an
 * extra, on top of email and the in-app bell, never instead of them.
 *
 * A Messenger failure is logged and swallowed: it must never stop the email
 * or database notification sent alongside it.
 */
class MessengerChannel
{
    public function __construct(
        private readonly MessengerClient $client,
        private readonly MessengerConnectionService $connections,
    ) {}

    public function send(object $notifiable, Notification $notification): void
    {
        if (! $notifiable instanceof User || $notifiable->messenger_psid === null) {
            return;
        }

        if (! $this->client->isConfigured() || ! method_exists($notification, 'toMessenger')) {
            return;
        }

        /** @var MessengerMessage|null $message */
        $message = $notification->toMessenger($notifiable);

        if ($message === null) {
            return;
        }

        try {
            if ($notifiable->hasOpenMessengerWindow()) {
                $this->client->sendMessage(
                    $notifiable->messenger_psid,
                    $message->text(),
                    $message->template->buttonLabel(),
                    $message->url,
                );
            } else {
                $this->client->sendTemplate(
                    $notifiable->messenger_psid,
                    $message->template,
                    $message->parameters,
                    $this->urlSuffix($message->url),
                );
            }
        } catch (MessengerException $e) {
            Log::warning('messenger.send_failed', [
                'user_id' => $notifiable->id,
                'notification' => $notification::class,
                'template' => $message->template->templateName(),
                'graph_code' => $e->graphCode,
                'graph_subcode' => $e->graphSubcode,
                'error' => $e->getMessage(),
            ]);

            // They blocked the Page or deleted their account. Keeping the
            // PSID would only fail the same way on every future notification.
            if ($e->recipientUnavailable()) {
                $this->connections->disconnect($notifiable);
            }
        }
    }

    /**
     * Template buttons are registered as APP_URL/{{1}}, so only the path is
     * sent. Hosts are compared rather than whole prefixes, because behind a
     * proxy route() can build http:// links while APP_URL says https://. A
     * link elsewhere falls back to the dashboard.
     */
    private function urlSuffix(string $url): string
    {
        $appHost = parse_url((string) config('app.url'), PHP_URL_HOST);
        $parts = parse_url($url);

        if ($appHost === null || ($parts['host'] ?? null) !== $appHost) {
            return 'dashboard';
        }

        $suffix = ltrim($parts['path'] ?? '', '/').(isset($parts['query']) ? '?'.$parts['query'] : '');

        return $suffix !== '' ? $suffix : 'dashboard';
    }
}
