import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Dedicated Pusher client used ONLY for payment confirmation (see
// use-booking-payment-channel.ts). Every other realtime feature in this app
// uses the shared Reverb client in `@/lib/echo` — this instance is kept fully
// separate so the two connections' lifecycles never interfere with each other.
let paymentEchoInstance: Echo<'pusher'> | null = null;

export function initPaymentEcho(): Echo<'pusher'> | null {
    if (paymentEchoInstance) {
        return paymentEchoInstance;
    }

    const pusherKey = import.meta.env.VITE_PUSHER_APP_KEY;
    const pusherCluster = import.meta.env.VITE_PUSHER_APP_CLUSTER;

    if (!pusherKey || !pusherCluster) {
        return null;
    }

    paymentEchoInstance = new Echo({
        broadcaster: 'pusher',
        key: pusherKey,
        cluster: pusherCluster,
        forceTLS: true,
        client: new Pusher(pusherKey, {
            cluster: pusherCluster,
            forceTLS: true,
        }),
        authEndpoint: '/broadcasting/pusher/auth',
    });

    return paymentEchoInstance;
}

export function destroyPaymentEcho(): void {
    if (!paymentEchoInstance) {
        return;
    }

    paymentEchoInstance.disconnect();
    paymentEchoInstance = null;
}
