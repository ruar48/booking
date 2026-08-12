import { router } from '@inertiajs/react';
import { useEffect } from 'react';

import { initEcho } from '@/lib/echo';

type PaymentPaidPayload = {
    registration_id: number;
    payment_status: 'paid';
};

export function useOpenPlayPaymentChannel(registrationId: number | null): void {
    useEffect(() => {
        if (!registrationId) {
            return;
        }

        const echo = initEcho();

        if (!echo) {
            return;
        }

        const channelName = `open-play-registrations.${registrationId}`;
        const channel = echo.private(channelName);

        channel.listen('.payment.paid', (payload: PaymentPaidPayload) => {
            if (payload.registration_id !== registrationId) {
                return;
            }

            router.reload({ only: ['registration', 'qrPayment'] });
        });

        return () => {
            channel.stopListening('.payment.paid');
            echo.leave(`private-${channelName}`);
        };
    }, [registrationId]);
}
