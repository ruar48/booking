<?php

namespace App\Events;

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
        if (! $this->payment->payable instanceof ResourceBooking) {
            return [];
        }

        return [
            new PrivateChannel("bookings.{$this->payment->payable_id}"),
        ];
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
        return [
            'booking_id' => $this->payment->payable_id,
            'payment_status' => 'paid',
        ];
    }
}
