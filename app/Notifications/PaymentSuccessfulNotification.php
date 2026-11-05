<?php

namespace App\Notifications;

use App\Models\OpenPlayRegistration;
use App\Models\Payment;
use App\Models\ResourceBooking;
use App\Services\PaymentReceiptPresenter;
use BaconQrCode\Renderer\Color\Rgb;
use BaconQrCode\Renderer\GDLibRenderer;
use BaconQrCode\Renderer\RendererStyle\Fill;
use BaconQrCode\Writer;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;
use Throwable;

class PaymentSuccessfulNotification extends Notification
{
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

    /**
     * The same e-receipt the checkout page prints, line for line, drawn as
     * paper coming out of the printer.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $receipt = app(PaymentReceiptPresenter::class)->forPayment($this->payment);
        $reference = $receipt['reference'];

        return (new MailMessage)
            ->subject($receipt['refund_due']
                ? __('Payment received, refund due · :reference', ['reference' => $reference])
                : __('Your e-receipt · :reference', ['reference' => $reference]))
            ->view(['emails.receipt', 'emails.receipt-text'], [
                'receipt' => $receipt,
                'receiptUrl' => $this->receiptUrl(),
                'qrPng' => $this->qrPng($receipt['verify_url']),
                'logoPath' => public_path('pwa-192.png'),
            ]);
    }

    /**
     * Where the receipt prints with its animation: the checkout page the
     * payment was made from, which shows it once paid.
     */
    private function receiptUrl(): ?string
    {
        $payable = $this->payment->payable;

        return match (true) {
            $payable instanceof ResourceBooking => route('bookings.checkout', $payable),
            $payable instanceof OpenPlayRegistration && $payable->openPlaySession !== null => route('open-play.checkout', $payable->openPlaySession),
            default => null,
        };
    }

    /**
     * The verification QR as a PNG, since mail clients don't show the SVG the
     * page uses. The email still reads fine without it, so a failure to draw
     * one never stops the receipt from going out.
     */
    private function qrPng(string $value): ?string
    {
        try {
            $paperAndInk = Fill::uniformColor(new Rgb(251, 249, 244), new Rgb(36, 34, 30));

            return (new Writer(new GDLibRenderer(240, 2, 'png', 9, $paperAndInk)))->writeString($value);
        } catch (Throwable $e) {
            Log::warning('receipt.email.qr_failed', [
                'payment_id' => $this->payment->id,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
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
