<?php

namespace App\Events;

use App\Models\OpenPlayRegistration;
use App\Models\Payment;
use App\Models\ResourceBooking;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithBroadcasting;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PaymentSuccessful implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithBroadcasting, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly Payment $payment,
    ) {
        // Payment confirmation is broadcast over Pusher specifically — every
        // other realtime feature in this app stays on the default Reverb connection.
        $this->broadcastVia('pusher');
    }

    /**
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return match (true) {
            $this->payment->payable instanceof ResourceBooking => [new PrivateChannel("bookings.{$this->payment->payable_id}")],
            $this->payment->payable instanceof OpenPlayRegistration => [new PrivateChannel("open-play-registrations.{$this->payment->payable_id}")],
            default => [],
        };
    }

    public function broadcastAs(): string
    {
        return 'payment.paid';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return match (true) {
            $this->payment->payable instanceof ResourceBooking => [
                'booking_id' => $this->payment->payable_id,
                'payment_status' => 'paid',
            ],
            $this->payment->payable instanceof OpenPlayRegistration => [
                'registration_id' => $this->payment->payable_id,
                'payment_status' => 'paid',
            ],
            default => ['payment_status' => 'paid'],
        };
    }
}
