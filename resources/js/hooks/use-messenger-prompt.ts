import { router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';

import { hasConsent } from '@/lib/cookie-consent';
import { connect } from '@/routes/messenger';

const DISMISS_KEY = 'messenger-prompt-dismissed-until';
const DISMISS_DAYS = 3;
const POLL_MS = 3000;
const WAIT_LIMIT_MS = 5 * 60 * 1000;
// When the link works it connects within seconds; only after this long is the
// connect-code fallback offered.
const STUCK_AFTER_MS = 20 * 1000;

function readDismissed(): boolean {
    try {
        const until = Number(window.localStorage.getItem(DISMISS_KEY));

        return Number.isFinite(until) && until > Date.now();
    } catch {
        return false;
    }
}

/**
 * Everything the floating Messenger button and the post-payment card share:
 * whether to nudge this customer to connect, the connect link, and waiting
 * for Meta's webhook to complete the link after they open it.
 */
export function useMessengerPrompt() {
    const prompt = usePage().props.messengerPrompt;
    const [dismissed, setDismissed] = useState(readDismissed);
    const [startedWaiting, setStartedWaiting] = useState(false);

    const needsConnect = Boolean(prompt?.available && prompt.signedIn && !prompt.connected);
    const waiting = startedWaiting && needsConnect;
    const [stuck, setStuck] = useState(false);

    // The link is completed by Meta's webhook, not by this page, so reload
    // the prompt until it says connected (or we give up).
    useEffect(() => {
        if (!waiting) {
            return;
        }

        const interval = window.setInterval(() => router.reload({ only: ['messengerPrompt'] }), POLL_MS);
        const timeout = window.setTimeout(() => setStartedWaiting(false), WAIT_LIMIT_MS);
        const stuckTimer = window.setTimeout(() => setStuck(true), STUCK_AFTER_MS);

        return () => {
            window.clearInterval(interval);
            window.clearTimeout(timeout);
            window.clearTimeout(stuckTimer);
        };
    }, [waiting]);

    const dismiss = useCallback(() => {
        setDismissed(true);

        // Snoozing across visits is a remembered preference; without consent
        // it is only hidden until the page is next loaded.
        if (!hasConsent('preferences')) {
            return;
        }

        try {
            window.localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000));
        } catch {
            // Private mode or blocked storage: it stays hidden for this visit only.
        }
    }, []);

    return {
        prompt,
        needsConnect,
        /** Whether the unprompted nudge (the floating callout) should show. */
        shouldNudge: needsConnect && !dismissed,
        dismiss,
        waiting,
        /** Tapped Connect a while ago and still not linked: offer the code. */
        stuck: stuck && needsConnect,
        connectHref: connect().url,
        startWaiting: () => setStartedWaiting(true),
    };
}
