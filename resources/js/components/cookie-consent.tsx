import { Link } from '@inertiajs/react';
import { Cookie, Lock, X } from 'lucide-react';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
    CONSENT_VERSION,
    consentCookieValue,
    onOpenCookieSettings,
    parseConsent,
    saveConsent,
    subscribeToConsent,
} from '@/lib/cookie-consent';
import type { CookieChoices, StoredConsent } from '@/lib/cookie-consent';
import { privacy } from '@/routes/legal';

/**
 * Asks once (and again whenever CONSENT_VERSION is bumped) which optional
 * cookies the visitor allows; "Cookie settings" links reopen it.
 *
 * Rendered outside the page (app.tsx withApp), and only after hydration: the
 * server can't see the visitor's choice, so it never renders the banner and
 * the first client render matches it.
 */
export function CookieConsent() {
    const raw = useSyncExternalStore(
        subscribeToConsent,
        consentCookieValue,
        () => null,
    );
    const consent = useMemo(
        () => (raw === null ? null : parseConsent(raw)),
        [raw],
    );
    const [reopened, setReopened] = useState(false);

    useEffect(() => onOpenCookieSettings(() => setReopened(true)), []);

    if (raw === null) {
        return null;
    }

    const undecided = consent === null || consent.version < CONSENT_VERSION;

    if (!undecided && !reopened) {
        return null;
    }

    return (
        <ConsentPanel
            // Remount on reopen so the switches start from the saved choice.
            key={reopened ? 'reopened' : 'first-visit'}
            saved={consent}
            dismissible={!undecided}
            onClose={() => setReopened(false)}
        />
    );
}

function ConsentPanel({
    saved,
    dismissible,
    onClose,
}: {
    saved: StoredConsent | null;
    dismissible: boolean;
    onClose: () => void;
}) {
    const [choices, setChoices] = useState<CookieChoices>({
        preferences: saved?.preferences ?? false,
        analytics: saved?.analytics ?? false,
    });
    // First visit: a compact layer with the two equal choices; the categories
    // open on "Customize". Reopened from "Cookie settings": straight to them.
    const [customizing, setCustomizing] = useState(dismissible);

    const decide = (next: CookieChoices) => {
        saveConsent(next);
        onClose();
    };

    return (
        <section
            aria-labelledby="cookie-consent-title"
            aria-describedby="cookie-consent-description"
            className="fixed inset-x-3 bottom-3 z-60 mx-auto max-h-[calc(100svh-1.5rem)] max-w-md overflow-y-auto rounded-2xl border bg-card p-5 text-card-foreground shadow-2xl ring-1 ring-black/5 sm:inset-x-auto sm:bottom-4 sm:left-4 print:hidden"
        >
            <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-lime/25 text-brand-navy dark:text-brand-lime">
                    <Cookie className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                    <h2
                        id="cookie-consent-title"
                        className="text-base font-semibold"
                    >
                        Cookies &amp; your privacy
                    </h2>
                    <p
                        id="cookie-consent-description"
                        className="mt-1 text-sm text-muted-foreground"
                    >
                        We only use what keeps the site and your bookings
                        working. With your OK we&apos;ll also remember a few
                        preferences and count visits.{' '}
                        <Link
                            href={`${privacy().url}#cookies`}
                            className="font-medium text-foreground underline underline-offset-2"
                        >
                            Privacy Notice
                        </Link>
                    </p>
                </div>
                {dismissible ? (
                    <button
                        type="button"
                        onClick={onClose}
                        className="-mt-1 -mr-1 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label="Close cookie settings"
                    >
                        <X className="size-4" />
                    </button>
                ) : null}
            </div>

            <div
                id="cookie-consent-categories"
                hidden={!customizing}
                className="mt-4 divide-y rounded-xl border"
            >
                <ConsentRow
                    id="consent-necessary"
                    title="Strictly necessary"
                    description="Keep you signed in and your checkout working, protect forms from forgery, store these choices, and keep the installed app working offline. The site can't work without them."
                    locked
                    checked
                />
                <ConsentRow
                    id="consent-preferences"
                    title="Preferences"
                    description="Remember your light or dark theme, whether the side menu is open and that you closed the install prompt — and load the Google map of our location, which lets Google set its own cookies."
                    checked={choices.preferences}
                    onChange={(preferences) =>
                        setChoices((current) => ({ ...current, preferences }))
                    }
                />
                <ConsentRow
                    id="consent-analytics"
                    title="Analytics"
                    description="Count you as one visitor and, when you're signed in, link the pages you view to your account so we can improve the site. Without it we only count anonymous page views."
                    checked={choices.analytics}
                    onChange={(analytics) =>
                        setChoices((current) => ({ ...current, analytics }))
                    }
                />
            </div>

            {/* Rejecting is exactly as easy as accepting. */}
            <div className="mt-4 grid grid-cols-2 gap-2">
                <Button
                    variant="outline"
                    onClick={() =>
                        decide({ preferences: false, analytics: false })
                    }
                >
                    Reject all
                </Button>
                <Button
                    onClick={() =>
                        decide({ preferences: true, analytics: true })
                    }
                >
                    Accept all
                </Button>
            </div>
            {customizing ? (
                <Button
                    variant="ghost"
                    className="mt-1 w-full"
                    onClick={() => decide(choices)}
                >
                    Save my choices
                </Button>
            ) : (
                <Button
                    variant="ghost"
                    className="mt-1 w-full"
                    aria-expanded={false}
                    aria-controls="cookie-consent-categories"
                    onClick={() => setCustomizing(true)}
                >
                    Customize
                </Button>
            )}
        </section>
    );
}

function ConsentRow({
    id,
    title,
    description,
    checked,
    locked = false,
    onChange,
}: {
    id: string;
    title: string;
    description: string;
    checked: boolean;
    locked?: boolean;
    onChange?: (checked: boolean) => void;
}) {
    return (
        <div className="flex items-start gap-3 p-3">
            <div className="min-w-0 flex-1">
                <label
                    htmlFor={id}
                    className="flex items-center gap-1.5 text-sm font-medium"
                >
                    {title}
                    {locked ? (
                        <Lock
                            className="size-3 text-muted-foreground"
                            aria-label="Always on"
                        />
                    ) : null}
                </label>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {description}
                </p>
            </div>
            <Switch
                id={id}
                size="lg"
                checked={checked}
                disabled={locked}
                onCheckedChange={(value) => onChange?.(value)}
                // Centred on the title line.
                className="-mt-1"
            />
        </div>
    );
}
