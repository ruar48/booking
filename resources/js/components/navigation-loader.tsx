import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

import { PaddleDuel } from '@/components/paddle-duel';

// Fast visits only get the thin progress bar; the rally waits until a load is
// slow enough that the visitor would otherwise wonder whether anything happened.
const SHOW_AFTER_MS = 600;

/**
 * Full-page rally shown while a slow page change is loading. Skips partial
 * reloads and same-page visits (search, filters, pagination keep state), which
 * already update in place.
 */
export function NavigationLoader() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        let timer: number | undefined;

        const removeStart = router.on('start', (event) => {
            const { visit } = event.detail;

            if (visit.method !== 'get' || visit.only.length > 0 || visit.preserveState === true) {
                return;
            }

            window.clearTimeout(timer);
            timer = window.setTimeout(() => setVisible(true), SHOW_AFTER_MS);
        });

        const removeFinish = router.on('finish', () => {
            window.clearTimeout(timer);
            setVisible(false);
        });

        return () => {
            window.clearTimeout(timer);
            removeStart();
            removeFinish();
        };
    }, []);

    if (!visible) {
        return null;
    }

    return (
        <div
            role="status"
            aria-live="polite"
            className="animate-page-enter fixed inset-0 z-[100] flex flex-col items-center justify-center gap-2 bg-brand-navy-dark/85 text-white backdrop-blur-sm"
        >
            <PaddleDuel className="w-[28rem] max-w-[90vw]" bigCheers label="Loading" />
            <p className="text-sm font-medium text-white/80">Loading…</p>
        </div>
    );
}
