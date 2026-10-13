<?php

namespace App\Notifications;

use App\Models\OpenPlaySession;
use App\Models\User;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OpenPlayPaidForYouNotification extends Notification
{
    public function __construct(
        public readonly User $payer,
        public readonly OpenPlaySession $session,
    ) {}

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $schedule = $this->session->starts_at?->toDayDateTimeString();

        return (new MailMessage)
            ->subject("{$this->payer->name} paid for your Open Play spot")
            ->greeting("Hi {$notifiable->name}!")
            ->line("{$this->payer->name} paid for your spot in {$this->session->title}.")
            ->when($schedule, fn (MailMessage $mail) => $mail->line("When: {$schedule}"))
            ->when($this->session->location, fn (MailMessage $mail) => $mail->line("Where: {$this->session->location}"))
            ->line("You're all set — nothing more to pay. See you on the court!");
    }
}
