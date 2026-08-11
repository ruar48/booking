import { router } from '@inertiajs/react';
import { useEffect } from 'react';

import { initPaymentEcho } from '@/lib/payment-pusher-echo';

type PaymentPaidPayload = {
    booking_id: number;
    payment_status: 'paid';
};

export function useBookingPaymentChannel(bookingId: number | null): void {
    useEffect(() => {
        if (!bookingId) {
            return;
        }

        const echo = initPaymentEcho();

        if (!echo) {
            return;
        }

        const channelName = `bookings.${bookingId}`;
        const channel = echo.private(channelName);

        channel.listen('.payment.paid', (payload: PaymentPaidPayload) => {
            if (payload.booking_id !== bookingId) {
                return;
            }

            router.reload({ only: ['booking'] });
        });

        return () => {
            channel.stopListening('.payment.paid');
            echo.leave(`private-${channelName}`);
        };
    }, [bookingId]);
}
