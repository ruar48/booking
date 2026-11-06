<?php

namespace App\Notifications\Channels;

use App\Integrations\Meta\MessengerClient;
use App\Models\User;
use App\Notifications\Messages\MessengerNotificationMessage;
use App\Services\Messenger\MessengerSender;
use Illuminate\Notifications\Notification;

/**
 * Delivers a notification to the recipient's Facebook Messenger, when they
 * have connected it. Anyone who hasn't is skipped silently — Messenger is an
 * extra, on top of email and the in-app bell, never instead of them.
 *
 * The sender never throws for a Meta failure, so a Messenger problem can never
 * stop the email or database notification sent alongside it.
 */
class MessengerChannel
{
    public function __construct(
        private readonly MessengerClient $client,
        private readonly MessengerSender $sender,
    ) {}

    public function send(object $notifiable, Notification $notification): void
    {
        if (! $notifiable instanceof User || ! $this->client->isConfigured() || ! method_exists($notification, 'toMessenger')) {
            return;
        }

        $conversation = $notifiable->messengerConversation;

        if ($conversation === null) {
            return;
        }

        /** @var MessengerNotificationMessage|null $notice */
        $notice = $notification->toMessenger($notifiable);

        if ($notice !== null) {
            $this->sender->sendNotification($conversation, $notice);
        }
    }
}
