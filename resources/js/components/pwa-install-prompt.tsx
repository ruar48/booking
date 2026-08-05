import { Button } from '@/components/ui/button';
import { usePwaInstall } from '@/hooks/use-pwa-install';
import { cn } from '@/lib/utils';
import { Download, Share, SquarePlus, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const DISMISSED_KEY = 'pwa-install-dismissed-at';
const DISMISS_SNOOZE_DAYS = 14;

function wasRecentlyDismissed(): boolean {
    const dismissedAt = localStorage.getItem(DISMISSED_KEY);
    if (!dismissedAt) return false;

    const daysSince = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24);
    return daysSince < DISMISS_SNOOZE_DAYS;
}

export function PwaInstallPrompt() {
    const { canInstall, isIos, promptInstall } = usePwaInstall();
    const [dismissed, setDismissed] = useState(true);

    useEffect(() => {
        setDismissed(wasRecentlyDismissed());
    }, []);

    const dismiss = () => {
        localStorage.setItem(DISMISSED_KEY, String(Date.now()));
        setDismissed(true);
    };

    const install = async () => {
        await promptInstall();
        dismiss();
    };

    if (!canInstall || dismissed) return null;

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
                    {isIos ? (
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

                    {!isIos && (
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
