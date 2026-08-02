<?php

namespace App\Notifications;

use App\Models\CourtBooking;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class BookingApprovedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly CourtBooking $booking,
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
        $court = $this->booking->court;

        return (new MailMessage)
            ->subject('Booking Approved')
            ->greeting('Hello '.$notifiable->name.',')
            ->line('Your court booking has been approved.')
            ->line('Court: '.($court?->name ?? 'N/A'))
            ->line('Date: '.$this->booking->starts_at->toDayDateTimeString())
            ->line('Thank you for using our booking platform.');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'booking_approved',
            'booking_id' => $this->booking->id,
            'court_id' => $this->booking->court_id,
            'starts_at' => $this->booking->starts_at->toIso8601String(),
            'ends_at' => $this->booking->ends_at->toIso8601String(),
        ];
    }
}
