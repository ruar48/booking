<?php

namespace App\Notifications;

use App\Models\Payment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PaymentSuccessfulNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly Payment $payment,
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
            ->subject('Payment Received')
            ->greeting('Hello '.$notifiable->name.',')
            ->line('Your payment has been successfully processed.')
            ->line('Invoice: '.$this->payment->invoice_number)
            ->line('Amount: '.$this->payment->currency.' '.$this->payment->amount)
            ->line('Thank you for your payment.');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'payment_successful',
            'payment_id' => $this->payment->id,
            'invoice_number' => $this->payment->invoice_number,
            'amount' => $this->payment->amount,
            'currency' => $this->payment->currency,
        ];
    }
}
