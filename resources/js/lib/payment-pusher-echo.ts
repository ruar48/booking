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

    // Let Echo construct the Pusher client itself (via the `Pusher` class
    // reference) instead of handing it a pre-built instance. Echo's
    // PusherConnector adopts a pre-built `client:` verbatim and never
    // applies its own `authEndpoint`/CSRF-header options to it — that
    // silently fell back to pusher-js's hard-coded default `/pusher/auth`,
    // which doesn't exist on this server (only `/broadcasting/pusher/auth`
    // does), producing a 404 on every private-channel subscription.
    paymentEchoInstance = new Echo({
        broadcaster: 'pusher',
        key: pusherKey,
        Pusher,
        cluster: pusherCluster,
        forceTLS: true,
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
