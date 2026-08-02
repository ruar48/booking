<?php

namespace App\Notifications;

use App\Models\GameMatch;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class MatchReminderNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly GameMatch $match,
    ) {}

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database', 'broadcast'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $isPlayer1 = $this->match->player1?->user_id === $notifiable->id;
        $opponent = $isPlayer1
            ? $this->match->player2?->user?->name
            : $this->match->player1?->user?->name;

        return (new MailMessage)
            ->subject('Upcoming Match Reminder')
            ->greeting('Hello '.$notifiable->name.',')
            ->line('You have an upcoming match scheduled.')
            ->line('Opponent: '.($opponent ?? 'TBD'))
            ->line('Scheduled: '.($this->match->scheduled_at?->toDayDateTimeString() ?? 'TBD'))
            ->line('Good luck!');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'match_reminder',
            'match_id' => $this->match->id,
            'tournament_id' => $this->match->tournament_id,
            'scheduled_at' => $this->match->scheduled_at?->toIso8601String(),
        ];
    }
}
