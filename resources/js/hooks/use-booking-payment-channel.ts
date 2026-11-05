import { router } from '@inertiajs/react';
import { useEffect } from 'react';

import { initEcho } from '@/lib/echo';

type PaymentPaidPayload = {
    booking_id: number;
    payment_status: 'paid';
};

const DEFAULT_RELOAD_PROPS = ['booking'];

/**
 * Reloads the page's booking the moment its payment is confirmed. Pages that
 * render more from the paid state (checkout's receipt) pass those props too,
 * so everything arrives in the same response. Pass a stable array — it is an
 * effect dependency.
 */
export function useBookingPaymentChannel(bookingId: number | null, reloadProps: string[] = DEFAULT_RELOAD_PROPS): void {
    useEffect(() => {
        if (!bookingId) {
            return;
        }

        const echo = initEcho();

        if (!echo) {
            return;
        }

        const channelName = `bookings.${bookingId}`;
        const channel = echo.private(channelName);

        channel.listen('.payment.paid', (payload: PaymentPaidPayload) => {
            if (payload.booking_id !== bookingId) {
                return;
            }

            router.reload({ only: reloadProps });
        });

        return () => {
            channel.stopListening('.payment.paid');
            echo.leave(`private-${channelName}`);
        };
    }, [bookingId, reloadProps]);
}
