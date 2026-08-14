<?php

namespace App\Notifications;

<<<<<<< HEAD
use App\Models\User;
=======
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Carbon;

class BookingFailedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
<<<<<<< HEAD
        public readonly User $customer,
=======
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
        public readonly int $resourceId,
        public readonly Carbon $startsAt,
        public readonly Carbon $endsAt,
        public readonly string $reason,
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
            ->subject('Booking Attempt Failed')
            ->greeting('Hello '.$notifiable->name.',')
            ->line('A court booking attempt could not be completed.')
            ->line('Date: '.$this->startsAt->toDayDateTimeString())
            ->line('Reason: '.$this->reason);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'booking_failed',
            'resource_id' => $this->resourceId,
            'starts_at' => $this->startsAt->toIso8601String(),
            'ends_at' => $this->endsAt->toIso8601String(),
            'reason' => $this->reason,
<<<<<<< HEAD
            'customer_name' => $this->customer->name,
            'customer_phone' => $this->customer->phone,
            'customer_email' => $this->customer->email,
=======
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
        ];
    }
}
