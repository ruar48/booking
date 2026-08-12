import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
    interface Window {
        Pusher: typeof Pusher;
        Echo?: Echo<'pusher'>;
    }
}

let echoInstance: Echo<'pusher'> | null = null;

export function initEcho(): Echo<'pusher'> | null {
    if (echoInstance) {
        return echoInstance;
    }

    const pusherKey = import.meta.env.VITE_PUSHER_APP_KEY;
    const pusherCluster = import.meta.env.VITE_PUSHER_APP_CLUSTER;

    if (!pusherKey || !pusherCluster) {
        return null;
    }

    window.Pusher = Pusher;

    // Let Echo construct the Pusher client itself (via the `Pusher` class
    // reference) instead of handing it a pre-built instance. Echo's
    // PusherConnector adopts a pre-built `client:` verbatim and never
    // applies its own `authEndpoint`/CSRF-header options to it — that
    // silently fell back to pusher-js's hard-coded default `/pusher/auth`,
    // which doesn't exist on this server (only `/broadcasting/pusher/auth`
    // does), producing a 404 on every private-channel subscription.
    echoInstance = new Echo({
        broadcaster: 'pusher',
        key: pusherKey,
        Pusher,
        cluster: pusherCluster,
        forceTLS: true,
        authEndpoint: '/broadcasting/pusher/auth',
    });

    window.Echo = echoInstance;

    return echoInstance;
}

export function destroyEcho(): void {
    if (!echoInstance) {
        return;
    }

    echoInstance.disconnect();
    echoInstance = null;
    delete window.Echo;
}
