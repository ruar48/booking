import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Download, Share, SquarePlus, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const DISMISSED_KEY = 'pwa-install-dismissed-at';
const DISMISS_SNOOZE_DAYS = 14;

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

function wasRecentlyDismissed(): boolean {
    const dismissedAt = localStorage.getItem(DISMISSED_KEY);
    if (!dismissedAt) return false;

    const daysSince = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24);
    return daysSince < DISMISS_SNOOZE_DAYS;
}

export function PwaInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showIosHint, setShowIosHint] = useState(false);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (isStandalone() || wasRecentlyDismissed()) return;

        const handleBeforeInstallPrompt = (event: Event) => {
            event.preventDefault();
            setDeferredPrompt(event as BeforeInstallPromptEvent);
            setVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        const handleAppInstalled = () => {
            setVisible(false);
            setDeferredPrompt(null);
        };

        window.addEventListener('appinstalled', handleAppInstalled);

        if (isIos()) {
            setShowIosHint(true);
            setVisible(true);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const dismiss = () => {
        localStorage.setItem(DISMISSED_KEY, String(Date.now()));
        setVisible(false);
    };

    const install = async () => {
        if (!deferredPrompt) return;

        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setVisible(false);
        } else {
            dismiss();
        }

        setDeferredPrompt(null);
    };

    if (!visible) return null;

    return (
        <div
            className={cn(
                'fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4',
                'animate-in slide-in-from-bottom-4 fade-in duration-300',
            )}
        >
            <div className="flex w-full max-w-md items-start gap-3 rounded-xl border bg-background p-4 shadow-lg">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <img src="/logos.png" alt="" className="size-7 rounded" />
                </div>

                <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">Install this app</p>
                    {showIosHint ? (
                        <p className="mt-1 text-sm text-muted-foreground">
                            Tap <Share className="inline size-3.5 -translate-y-px" /> then{' '}
                            <span className="inline-flex items-center gap-1 font-medium text-foreground">
                                Add to Home Screen <SquarePlus className="inline size-3.5" />
                            </span>{' '}
                            for quick access.
                        </p>
                    ) : (
                        <p className="mt-1 text-sm text-muted-foreground">
                            Add it to your home screen for quick, full-screen access.
                        </p>
                    )}

                    {!showIosHint && (
                        <div className="mt-3 flex gap-2">
                            <Button size="sm" onClick={install}>
                                <Download />
                                Install
                            </Button>
                            <Button size="sm" variant="ghost" onClick={dismiss}>
                                Not now
                            </Button>
                        </div>
                    )}
                </div>

                <button
                    type="button"
                    onClick={dismiss}
                    aria-label="Dismiss"
                    className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                    <X className="size-4" />
                </button>
            </div>
        </div>
    );
}
