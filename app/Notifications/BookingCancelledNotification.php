<?php

namespace App\Notifications;

use App\Models\ResourceBooking;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class BookingCancelledNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly ResourceBooking $booking,
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
        $resource = $this->booking->resource;

        return (new MailMessage)
            ->subject('Booking Cancelled')
            ->greeting('Hello '.$notifiable->name.',')
            ->line('Your court booking has been cancelled.')
            ->line('Court: '.($resource?->name ?? 'N/A'))
            ->line('Date: '.$this->booking->starts_at->toDayDateTimeString())
            ->when(
                $this->booking->cancellation_reason,
                fn (MailMessage $mail) => $mail->line('Reason: '.$this->booking->cancellation_reason),
            );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'booking_cancelled',
            'booking_id' => $this->booking->id,
            'resource_id' => $this->booking->resource_id,
            'starts_at' => $this->booking->starts_at->toIso8601String(),
            'cancellation_reason' => $this->booking->cancellation_reason,
            'customer_name' => $this->booking->user?->name,
            'customer_phone' => $this->booking->user?->phone,
            'customer_email' => $this->booking->user?->email,
        ];
    }
}
