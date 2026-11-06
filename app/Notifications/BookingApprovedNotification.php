<?php

namespace App\Notifications;

use App\Enums\MessengerTemplate;
use App\Models\ResourceBooking;
use App\Models\User;
use App\Notifications\Channels\MessengerChannel;
use App\Notifications\Messages\MessengerNotificationMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class BookingApprovedNotification extends Notification
{
    public function __construct(
        public readonly ResourceBooking $booking,
    ) {}

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database', 'broadcast', MessengerChannel::class];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $resource = $this->booking->resource;

        return (new MailMessage)
            ->subject('Booking Approved')
            ->greeting('Hello '.$notifiable->name.',')
            ->line('Your court booking has been approved.')
            ->line('Court: '.($resource?->name ?? 'N/A'))
            ->line('Date: '.$this->booking->starts_at->toDayDateTimeString())
            ->line('Thank you for using our booking platform.');
    }

    public function toMessenger(User $notifiable): MessengerNotificationMessage
    {
        return MessengerNotificationMessage::forBooking(
            $this->booking,
            $notifiable,
            MessengerTemplate::BookingApproved,
            MessengerTemplate::BookingApprovedStaff,
            route('bookings.show', $this->booking),
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'booking_approved',
            'booking_id' => $this->booking->id,
            'resource_id' => $this->booking->resource_id,
            'starts_at' => $this->booking->starts_at->toIso8601String(),
            'ends_at' => $this->booking->ends_at->toIso8601String(),
        ];
    }
}
