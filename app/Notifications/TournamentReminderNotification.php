<?php

namespace App\Notifications;

use App\Models\Tournament;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TournamentReminderNotification extends Notification
{
    public function __construct(
        public readonly Tournament $tournament,
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
        return (new MailMessage)
            ->subject('Tournament Reminder: '.$this->tournament->name)
            ->greeting('Hello '.$notifiable->name.',')
            ->line('This is a reminder about an upcoming tournament.')
            ->line('Tournament: '.$this->tournament->name)
            ->line('Starts: '.($this->tournament->starts_at?->toDayDateTimeString() ?? 'TBD'))
            ->line('We look forward to seeing you there.');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'tournament_reminder',
            'tournament_id' => $this->tournament->id,
            'tournament_name' => $this->tournament->name,
            'starts_at' => $this->tournament->starts_at?->toIso8601String(),
        ];
    }
}
