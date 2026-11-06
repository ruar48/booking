import { router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';

import { connect } from '@/routes/messenger';

const DISMISS_KEY = 'messenger-prompt-dismissed-until';
const DISMISS_DAYS = 3;
const POLL_MS = 3000;
const WAIT_LIMIT_MS = 5 * 60 * 1000;

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

    // The link is completed by Meta's webhook, not by this page, so reload
    // the prompt until it says connected (or we give up).
    useEffect(() => {
        if (!waiting) {
            return;
        }

        const interval = window.setInterval(() => router.reload({ only: ['messengerPrompt'] }), POLL_MS);
        const timeout = window.setTimeout(() => setStartedWaiting(false), WAIT_LIMIT_MS);

        return () => {
            window.clearInterval(interval);
            window.clearTimeout(timeout);
        };
    }, [waiting]);

    const dismiss = useCallback(() => {
        setDismissed(true);

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
        connectHref: connect().url,
        startWaiting: () => setStartedWaiting(true),
    };
}
