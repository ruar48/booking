<?php

namespace App\Services\Messenger;

use App\Enums\MessengerDirection;
use App\Enums\MessengerMessageSource;
use App\Enums\MessengerMessageStatus;
use App\Events\MessengerConversationUpdated;
use App\Integrations\Meta\MessengerClient;
use App\Integrations\Meta\MessengerException;
use App\Models\MessengerConversation;
use App\Models\MessengerMessage;
use App\Models\User;
use App\Notifications\Messages\MessengerNotificationMessage;
use Closure;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * The one way anything leaves the Page: staff replies, notifications,
 * announcements and system messages all go through here, so every one of them
 * shows up in the inbox thread with its delivery status.
 *
 * Never throws for a Meta failure. The message is saved as Failed with the
 * reason, which the inbox shows, and the caller carries on.
 */
class MessengerSender
{
    public function __construct(
        private readonly MessengerClient $client,
    ) {}

    /**
     * An ordinary message. The caller is responsible for checking the
     * conversation's window first.
     */
    public function sendText(
        MessengerConversation $conversation,
        string $text,
        MessengerMessageSource $source,
        ?User $sentBy = null,
        ?string $buttonTitle = null,
        ?string $buttonUrl = null,
    ): MessengerMessage {
        $isReply = $source === MessengerMessageSource::Reply;
        $humanAgent = $isReply && ! $conversation->hasOpenWindow() && $conversation->canReplyAsHumanAgent();

        return $this->dispatch(
            $conversation,
            $text,
            $source,
            $sentBy,
            $buttonTitle,
            $buttonUrl,
            fn (MessengerMessage $message) => $this->client->sendMessage(
                $conversation->psid,
                $text,
                $buttonTitle,
                $buttonUrl,
                messagingType: $isReply ? 'RESPONSE' : 'UPDATE',
                humanAgentTag: $humanAgent,
                metadata: 'local:'.$message->id,
            ),
        );
    }

    /**
     * A booking or payment notification: an ordinary message inside the
     * 24-hour window, the approved Utility Template outside it.
     */
    public function sendNotification(MessengerConversation $conversation, MessengerNotificationMessage $notice): MessengerMessage
    {
        $text = $notice->text();
        $buttonTitle = $notice->template->buttonLabel();

        if ($conversation->hasOpenWindow()) {
            return $this->sendText($conversation, $text, MessengerMessageSource::Notification, null, $buttonTitle, $notice->url);
        }

        return $this->dispatch(
            $conversation,
            $text,
            MessengerMessageSource::Notification,
            null,
            $buttonTitle,
            $notice->url,
            fn () => $this->client->sendTemplate(
                $conversation->psid,
                $notice->template,
                $notice->parameters,
                $this->urlSuffix($notice->url),
            ),
        );
    }

    /**
     * Saves the message as Sending, hands it to Meta, then records the
     * outcome on it and on the conversation.
     *
     * @param  Closure(MessengerMessage): string  $send  returns Meta's message id
     */
    private function dispatch(
        MessengerConversation $conversation,
        string $text,
        MessengerMessageSource $source,
        ?User $sentBy,
        ?string $buttonTitle,
        ?string $buttonUrl,
        Closure $send,
    ): MessengerMessage {
        $message = $conversation->messages()->create([
            'direction' => MessengerDirection::Outbound,
            'source' => $source,
            'status' => MessengerMessageStatus::Sending,
            'text' => $text,
            'attachments' => $buttonTitle !== null && $buttonUrl !== null
                ? [['type' => 'button', 'title' => $buttonTitle, 'url' => $buttonUrl]]
                : null,
            'sent_by_id' => $sentBy?->id,
            'sent_at' => now(),
        ]);

        try {
            $mid = $send($message);

            DB::transaction(function () use ($message, $mid): void {
                // Meta's echo of this message can beat the API response here,
                // and without our metadata (templates) it gets saved as if it
                // were typed in Facebook's inbox. This row is the real one.
                MessengerMessage::query()->where('mid', $mid)->whereKeyNot($message->id)->delete();

                $message->forceFill([
                    'mid' => $mid !== '' ? $mid : null,
                    'status' => MessengerMessageStatus::Sent,
                ])->save();
            });
        } catch (MessengerException $e) {
            Log::warning('messenger.send_failed', [
                'conversation_id' => $conversation->id,
                'source' => $source->value,
                'graph_code' => $e->graphCode,
                'graph_subcode' => $e->graphSubcode,
                'error' => $e->getMessage(),
            ]);

            $message->forceFill([
                'status' => MessengerMessageStatus::Failed,
                'error' => Str::limit($e->getMessage(), 250),
            ])->save();

            // They blocked the Page or deleted their account. Keeping the
            // link would only fail the same way on every future notification.
            if ($e->recipientUnavailable() && $conversation->user_id !== null) {
                $conversation->forceFill(['user_id' => null, 'linked_at' => null])->save();
            }
        }

        $conversation->forceFill([
            'last_message_preview' => Str::limit(Str::squish($text), 120),
            'last_message_at' => $message->sent_at,
        ])->save();

        MessengerConversationUpdated::broadcastSafely($conversation);

        return $message;
    }

    /**
     * Template buttons are registered as APP_URL/{{url_suffix}}, so only the path is
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
