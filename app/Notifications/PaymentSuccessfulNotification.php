<?php

namespace App\Notifications;

use App\Models\OpenPlayRegistration;
use App\Models\Payment;
use App\Models\ResourceBooking;
use App\Models\Setting;
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
        $payable = $this->payment->payable;

        [$itemDescription, $itemSchedule] = match (true) {
            $payable instanceof ResourceBooking => [
                'Court booking'.($payable->resource ? ' — '.$payable->resource->name : ''),
                $payable->starts_at?->toDayDateTimeString(),
            ],
            $payable instanceof OpenPlayRegistration => [
                'Open Play registration'.($payable->openPlaySession ? ' — '.$payable->openPlaySession->title : ''),
                $payable->openPlaySession?->starts_at?->toDayDateTimeString(),
            ],
            default => ['Payment', null],
        };

        return (new MailMessage)
            ->subject('Your Payment Receipt')
            ->view('emails.receipt', [
                'venueName' => $this->venueName(),
                'amount' => number_format((float) $this->payment->amount, 2),
                'currency' => $this->payment->currency,
                'invoiceNumber' => $this->payment->invoice_number,
                'paymentMethod' => $this->payment->payment_method
                    ? str($this->payment->payment_method)->replace('_', ' ')->title()->toString()
                    : 'Online payment',
                'payerName' => $this->payment->user->name,
                'paidAt' => ($this->payment->paid_at ?? now())->toDayDateTimeString(),
                'itemDescription' => $itemDescription,
                'itemSchedule' => $itemSchedule,
            ]);
    }

    private function venueName(): string
    {
        $profile = Setting::query()
            ->where('group', 'venue')
            ->where('key', 'profile')
            ->value('value') ?? [];

        return $profile['name'] ?? config('app.name');
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
