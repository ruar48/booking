<?php

namespace App\Jobs;

use App\Enums\MessengerMessageSource;
use App\Integrations\Meta\MessengerClient;
use App\Models\MessengerConversation;
use App\Models\OpenPlaySession;
use App\Services\Messenger\MessengerSender;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Support\Facades\Log;

/**
 * Tells the Page's Messenger contacts about a newly created Open Play session.
 *
 * Meta treats an announcement as promotional, which no Utility Template may
 * carry, so it can only reach people who wrote to the Page in the last 24
 * hours. Everyone else is skipped — never sent something Meta would flag.
 */
class AnnounceOpenPlayOnMessenger
{
    use Dispatchable;

    public function __construct(
        public readonly OpenPlaySession $session,
    ) {}

    public function handle(MessengerClient $client, MessengerSender $sender): void
    {
        if (! $client->isConfigured()) {
            return;
        }

        $text = $this->text();
        $joinUrl = route('open-play.join', $this->session);
        $sent = 0;

        MessengerConversation::query()
            ->whereNotNull('last_inbound_at')
            ->where('last_inbound_at', '>', now()->subDay())
            ->lazyById()
            ->each(function (MessengerConversation $conversation) use ($sender, $text, $joinUrl, &$sent) {
                if (! $conversation->hasOpenWindow()) {
                    return;
                }

                $sender->sendText($conversation, $text, MessengerMessageSource::Announcement, null, 'Join Open Play', $joinUrl);
                $sent++;
            });

        Log::info('messenger.open_play_announced', [
            'open_play_session_id' => $this->session->id,
            'sent' => $sent,
            'skipped_outside_window' => MessengerConversation::query()->count() - $sent,
        ]);
    }

    private function text(): string
    {
        $session = $this->session;
        $timezone = config('app.timezone');
        $starts = $session->starts_at->copy()->setTimezone($timezone);

        $when = $starts->format('D, M j, g:i A')
            .($session->ends_at ? ' to '.$session->ends_at->copy()->setTimezone($timezone)->format('g:i A') : '');

        $details = array_filter([
            $session->price_per_player !== null && (float) $session->price_per_player > 0
                ? 'PHP '.number_format((float) $session->price_per_player, 2).' per player'
                : 'Free to join',
            $session->max_players ? $session->max_players.' slots' : null,
            $session->skill_level ? ucfirst((string) $session->skill_level).' level' : null,
        ]);

        return "New Open Play: {$session->title}\n{$when}"
            .($session->location ? "\n{$session->location}" : '')
            ."\n".implode(' · ', $details)
            ."\n\nTap below to reserve your spot.";
    }
}
