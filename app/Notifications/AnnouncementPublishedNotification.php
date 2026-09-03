<?php

namespace App\Notifications;

use App\Enums\AnnouncementType;
use App\Models\Announcement;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\HtmlString;

class AnnouncementPublishedNotification extends Notification
{
    public function __construct(
        public readonly Announcement $announcement,
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
        $prefix = $this->announcement->type->emailPrefix();

        $mail = (new MailMessage)
            ->subject(($prefix ? "[{$prefix}] " : '').$this->announcement->title)
            ->greeting('Hello '.$notifiable->name.',')
            ->line($this->announcement->title);

        if ($this->announcement->image_url) {
            $mail->line(new HtmlString(
                '<img src="'.$this->announcement->image_url.'" alt="" style="max-width:100%;border-radius:8px;" />',
            ));
        }

        $mail->line($this->announcement->content);

        $session = $this->announcement->type === AnnouncementType::OpenPlay
            ? $this->announcement->openPlaySession
            : null;

        if ($session) {
            $mail->line('**'.$session->title.'**')
                ->line('When: '.$session->starts_at->toDayDateTimeString())
                ->lineIf((bool) $session->location, 'Where: '.$session->location)
                ->action('Join this session', route('open-play.join', $session));
        }

        return $mail;
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'announcement_published',
            'announcement_id' => $this->announcement->id,
            'announcement_type' => $this->announcement->type->value,
            'title' => $this->announcement->title,
            'image_url' => $this->announcement->image_url,
            'published_at' => $this->announcement->published_at?->toIso8601String(),
        ];
    }
}
