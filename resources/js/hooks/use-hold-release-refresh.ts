import { router } from '@inertiajs/react';
import { useEffect } from 'react';

import type { BookedSlot } from '@/types/booking';

/** The server releases holds on a one-minute cycle; give it time to run. */
const RELEASE_LAG_MS = 65_000;

/**
 * Reloads the slot grid shortly after the next unpaid hold is due to open, so
 * a slot someone abandoned at checkout turns "Open" without a manual refresh.
 */
export function useHoldReleaseRefresh(bookedSlots: BookedSlot[]): void {
    useEffect(() => {
        const now = Date.now();
        const nextRelease = bookedSlots
            .map((slot) => (slot.held_until ? new Date(slot.held_until).getTime() : null))
            .filter((time): time is number => time !== null)
            .reduce<number | null>((soonest, time) => (soonest === null || time < soonest ? time : soonest), null);

        if (nextRelease === null) {
            return;
        }

        // Already-due holds are retried every minute until the server catches up.
        const delay = Math.max(nextRelease - now, 0) + RELEASE_LAG_MS;
        const timeout = window.setTimeout(
            () => router.reload({ only: ['bookedSlots'] }),
            delay,
        );

        return () => window.clearTimeout(timeout);
    }, [bookedSlots]);
}
