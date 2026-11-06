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
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Turns Meta's webhook deliveries into inbox state: messages people send,
 * messages staff type in Facebook's own inbox (echoes), and the delivery and
 * read receipts behind "Sent / Delivered / Seen".
 *
 * Unknown event kinds are ignored: Meta adds fields over time, and the
 * webhook must still answer 200.
 */
class MessengerWebhookProcessor
{
    public function __construct(
        private readonly MessengerClient $client,
        private readonly MessengerConnectionService $connections,
    ) {}

    /**
     * @param  array<string, mixed>  $payload
     */
    public function handle(array $payload): void
    {
        if (($payload['object'] ?? null) !== 'page') {
            return;
        }

        foreach ($payload['entry'] ?? [] as $entry) {
            foreach ($entry['messaging'] ?? [] as $event) {
                if (is_array($event)) {
                    $this->handleEvent($event);
                }
            }

            foreach ($entry['changes'] ?? [] as $change) {
                if (($change['field'] ?? null) === 'message_template_status_update') {
                    Log::info('messenger.template_status', [
                        'template' => $change['value']['message_template_name'] ?? null,
                        'event' => $change['value']['event'] ?? null,
                        'reason' => $change['value']['reason'] ?? null,
                    ]);
                }
            }
        }
    }

    /**
     * @param  array<string, mixed>  $event
     */
    private function handleEvent(array $event): void
    {
        // An echo is the Page's own outgoing message, so the person is the
        // recipient rather than the sender.
        $isEcho = ! empty($event['message']['is_echo']);
        $psid = $isEcho ? ($event['recipient']['id'] ?? null) : ($event['sender']['id'] ?? null);

        if (! is_string($psid) || $psid === '') {
            return;
        }

        $at = $this->timestamp($event['timestamp'] ?? null);
        $conversation = $this->conversationFor($psid);

        match (true) {
            $isEcho => $this->recordEcho($conversation, $event['message'], $at),
            isset($event['delivery']) => $this->recordDelivery($conversation, $event['delivery']),
            isset($event['read']) => $this->recordRead($conversation, $event['read']),
            default => $this->recordFromCustomer($conversation, $event, $at),
        };

        MessengerConversationUpdated::broadcastSafely($conversation);
    }

    /**
     * @param  array<string, mixed>  $event
     */
    private function recordFromCustomer(MessengerConversation $conversation, array $event, CarbonInterface $at): void
    {
        $text = null;
        $attachments = null;
        $mid = null;

        if (isset($event['message'])) {
            $mid = $event['message']['mid'] ?? null;
            $text = $event['message']['text'] ?? null;
            $attachments = $this->attachments($event['message']['attachments'] ?? []);
        } elseif (isset($event['postback'])) {
            // A tapped button, e.g. "Get Started". Messenger shows it in the
            // thread as their message, so the inbox does too.
            $text = $event['postback']['title'] ?? null;
        }

        // Anything the person does opens the 24-hour window.
        // Meta can deliver events out of order, so never move it backwards.
        if ($conversation->last_inbound_at === null || $at->greaterThan($conversation->last_inbound_at)) {
            $conversation->last_inbound_at = $at;
        }

        $isNew = $text !== null || $attachments !== null;

        if ($isNew && ($mid === null || ! MessengerMessage::query()->where('mid', $mid)->exists())) {
            $conversation->messages()->create([
                'direction' => MessengerDirection::Inbound,
                'source' => MessengerMessageSource::Customer,
                'status' => MessengerMessageStatus::Received,
                'mid' => $mid,
                'text' => $text,
                'attachments' => $attachments,
                'sent_at' => $at,
            ]);

            $conversation->unread_count++;
            $conversation->last_message_preview = $this->preview($text, $attachments);
            $conversation->last_message_at = $at;
        }

        $conversation->save();

        // The ref arrives on its own for an existing conversation, and inside
        // the "Get Started" postback for a brand-new one.
        $ref = $event['referral']['ref'] ?? $event['postback']['referral']['ref'] ?? null;

        if (is_string($ref) && $ref !== '') {
            $this->connections->completeLink($ref, $conversation);
        }
    }

    /**
     * @param  array<string, mixed>  $message
     */
    private function recordEcho(MessengerConversation $conversation, array $message, CarbonInterface $at): void
    {
        $mid = $message['mid'] ?? null;
        $metadata = $message['metadata'] ?? null;

        // Our own send coming back. Take Meta's timestamp for it: read
        // receipts are watermarks on Meta's clock, not ours.
        $own = is_string($metadata) && str_starts_with($metadata, 'local:')
            ? $conversation->messages()->find((int) substr($metadata, 6))
            : ($mid !== null ? MessengerMessage::query()->where('mid', $mid)->first() : null);

        if ($own !== null) {
            $own->forceFill([
                'mid' => $own->mid ?? $mid,
                'sent_at' => $at,
                'status' => $own->status === MessengerMessageStatus::Sending ? MessengerMessageStatus::Sent : $own->status,
            ])->save();

            return;
        }

        $text = $message['text'] ?? null;
        $attachments = $this->attachments($message['attachments'] ?? []);

        $conversation->messages()->create([
            'direction' => MessengerDirection::Outbound,
            'source' => MessengerMessageSource::PageInbox,
            'status' => MessengerMessageStatus::Sent,
            'mid' => $mid,
            'text' => $text,
            'attachments' => $attachments,
            'sent_at' => $at,
        ]);

        // Staff answered in Facebook, so they have seen the chat.
        $conversation->forceFill([
            'unread_count' => 0,
            'last_message_preview' => $this->preview($text, $attachments),
            'last_message_at' => $at,
        ])->save();
    }

    /**
     * @param  array<string, mixed>  $delivery
     */
    private function recordDelivery(MessengerConversation $conversation, array $delivery): void
    {
        $mids = array_filter((array) ($delivery['mids'] ?? []), 'is_string');

        $query = $conversation->messages()
            ->where('direction', MessengerDirection::Outbound)
            ->where('status', MessengerMessageStatus::Sent);

        if ($mids !== []) {
            (clone $query)->whereIn('mid', $mids)->update(['status' => MessengerMessageStatus::Delivered]);
        }

        if (isset($delivery['watermark'])) {
            (clone $query)->where('sent_at', '<=', $this->timestamp($delivery['watermark']))
                ->update(['status' => MessengerMessageStatus::Delivered]);
        }
    }

    /**
     * Everything the Page sent up to the watermark has been seen.
     *
     * @param  array<string, mixed>  $read
     */
    private function recordRead(MessengerConversation $conversation, array $read): void
    {
        if (! isset($read['watermark'])) {
            return;
        }

        $conversation->messages()
            ->where('direction', MessengerDirection::Outbound)
            ->whereIn('status', [MessengerMessageStatus::Sent, MessengerMessageStatus::Delivered])
            ->where('sent_at', '<=', $this->timestamp($read['watermark']))
            ->update(['status' => MessengerMessageStatus::Read]);
    }

    private function conversationFor(string $psid): MessengerConversation
    {
        $conversation = MessengerConversation::query()->firstOrCreate(['psid' => $psid]);

        if ($conversation->wasRecentlyCreated) {
            $this->fetchProfileAfterResponse($conversation);
        }

        return $conversation;
    }

    /**
     * Name and photo for the inbox. Optional: Meta only shares them once the
     * app has profile access, and the inbox has a fallback name.
     */
    private function fetchProfileAfterResponse(MessengerConversation $conversation): void
    {
        $client = $this->client;

        dispatch(function () use ($client, $conversation): void {
            try {
                $profile = $client->profile($conversation->psid);

                $conversation->forceFill([
                    'name' => $conversation->name ?? $profile['name'],
                    'avatar_url' => $profile['avatar_url'],
                ])->save();

                MessengerConversationUpdated::broadcastSafely($conversation);
            } catch (MessengerException $e) {
                Log::info('messenger.profile_unavailable', ['conversation_id' => $conversation->id, 'error' => $e->getMessage()]);
            }
        })->afterResponse();
    }

    /**
     * @param  array<int, mixed>  $attachments
     * @return list<array{type: string, url: string|null}>|null
     */
    private function attachments(array $attachments): ?array
    {
        $kept = collect($attachments)
            ->filter(fn ($attachment) => is_array($attachment) && isset($attachment['type']))
            ->map(fn (array $attachment) => [
                'type' => (string) $attachment['type'],
                'url' => isset($attachment['payload']['url']) && is_string($attachment['payload']['url'])
                    ? $attachment['payload']['url']
                    : null,
            ])
            ->values()
            ->all();

        return $kept !== [] ? $kept : null;
    }

    /**
     * @param  list<array{type: string, url: string|null}>|null  $attachments
     */
    private function preview(?string $text, ?array $attachments): string
    {
        if (filled($text)) {
            return Str::limit(Str::squish($text), 120);
        }

        return match ($attachments[0]['type'] ?? null) {
            'image' => 'Sent a photo',
            'video' => 'Sent a video',
            'audio' => 'Sent a voice message',
            'file' => 'Sent a file',
            default => 'Sent an attachment',
        };
    }

    private function timestamp(mixed $milliseconds): CarbonInterface
    {
        return is_numeric($milliseconds)
            ? Date::createFromTimestampMs((int) $milliseconds)->setTimezone(config('app.timezone'))
            : now();
    }
}
