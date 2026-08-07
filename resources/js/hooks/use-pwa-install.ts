import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isStandalone(): boolean {
    if (typeof window === 'undefined') return false;

    return (
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    );
}

function isIos(): boolean {
    if (typeof window === 'undefined') return false;

    return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

const WAS_INSTALLED_KEY = 'pwa-was-installed';
const DISMISSED_KEY = 'pwa-install-dismissed-at';

export function usePwaInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [installed, setInstalled] = useState(isStandalone);

    useEffect(() => {
        // If the app was installed before but is no longer running standalone,
        // the user uninstalled it — clear any dismiss snooze so the prompt reappears.
        if (!isStandalone() && localStorage.getItem(WAS_INSTALLED_KEY) === 'true') {
            localStorage.removeItem(WAS_INSTALLED_KEY);
            localStorage.removeItem(DISMISSED_KEY);
        }

        const handleBeforeInstallPrompt = (event: Event) => {
            event.preventDefault();
            setDeferredPrompt(event as BeforeInstallPromptEvent);
        };

        const handleAppInstalled = () => {
            setInstalled(true);
            setDeferredPrompt(null);
            localStorage.setItem(WAS_INSTALLED_KEY, 'true');
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const promptInstall = async () => {
        if (!deferredPrompt) return;

        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setInstalled(true);
            localStorage.setItem(WAS_INSTALLED_KEY, 'true');
        }

        setDeferredPrompt(null);
    };

    return {
        installed,
        isIos: isIos() && !installed,
        canInstall: !installed && (deferredPrompt !== null || isIos()),
        promptInstall,
    };
}
