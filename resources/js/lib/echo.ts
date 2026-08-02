import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
    interface Window {
        Pusher: typeof Pusher;
        Echo?: Echo<'reverb'>;
    }
}

let echoInstance: Echo<'reverb'> | null = null;

export function initEcho(): Echo<'reverb'> | null {
    if (echoInstance) {
        return echoInstance;
    }

    const reverbKey = import.meta.env.VITE_REVERB_APP_KEY;

    if (!reverbKey) {
        return null;
    }

    window.Pusher = Pusher;

    const reverbHost =
        import.meta.env.VITE_REVERB_HOST ?? window.location.hostname;
    const reverbPort = Number(import.meta.env.VITE_REVERB_PORT ?? 8080);
    const reverbScheme = import.meta.env.VITE_REVERB_SCHEME ?? 'http';
    const useTls = reverbScheme === 'https';

    echoInstance = new Echo({
        broadcaster: 'reverb',
        key: reverbKey,
        wsHost: reverbHost,
        wsPort: reverbPort,
        wssPort: reverbPort,
        forceTLS: useTls,
        enabledTransports: useTls ? ['wss'] : ['ws'],
        authEndpoint: '/broadcasting/auth',
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
