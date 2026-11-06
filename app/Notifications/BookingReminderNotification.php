<?php

namespace App\Notifications;

use App\Enums\MessengerTemplate;
use App\Models\ResourceBooking;
use App\Models\User;
use App\Notifications\Channels\MessengerChannel;
use App\Notifications\Messages\MessengerMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class BookingReminderNotification extends Notification
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
            ->subject('Upcoming Booking Reminder')
            ->greeting('Hello '.$notifiable->name.',')
            ->line('This is a reminder about your upcoming court booking.')
            ->line('Court: '.($resource?->name ?? 'N/A'))
            ->line('Starts: '.$this->booking->starts_at->toDayDateTimeString())
            ->line('Ends: '.$this->booking->ends_at->toDayDateTimeString());
    }

    /**
     * Reminders only go to the customer, so there is no staff wording.
     */
    public function toMessenger(User $notifiable): MessengerMessage
    {
        return MessengerMessage::forBooking(
            $this->booking,
            $notifiable,
            MessengerTemplate::BookingReminder,
            MessengerTemplate::BookingReminder,
            route('bookings.show', $this->booking),
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'booking_reminder',
            'booking_id' => $this->booking->id,
            'resource_id' => $this->booking->resource_id,
            'starts_at' => $this->booking->starts_at->toIso8601String(),
            'ends_at' => $this->booking->ends_at->toIso8601String(),
        ];
    }
}
