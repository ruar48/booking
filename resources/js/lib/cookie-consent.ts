/**
 * The visitor's cookie choices.
 *
 * Saved in a plain first-party cookie (not encrypted, see bootstrap/app.php)
 * so the server can honour them as well: App\Support\CookieConsent reads the
 * analytics choice before recording a page view.
 *
 * Strictly necessary storage — the session, CSRF and remember-me cookies,
 * this cookie, and the installed app's offline copy — needs no consent.
 * Everything listed under a category below waits for a yes.
 */
export type ConsentCategory = 'preferences' | 'analytics';

export type CookieChoices = Record<ConsentCategory, boolean>;

export type StoredConsent = CookieChoices & {
    version: number;
    decidedAt: string;
};

/** Bump when the banner starts asking about something new: everyone is asked again. */
export const CONSENT_VERSION = 1;

const COOKIE_NAME = 'cookie_consent';
// Choices are asked for again after a year rather than assumed forever.
const MAX_AGE_SECONDS = 365 * 24 * 60 * 60;
const CHANGE_EVENT = 'cookie-consent:change';
const OPEN_EVENT = 'cookie-consent:open';

/** What "Preferences" covers, so withdrawing it can forget it all. */
const PREFERENCE_COOKIES = ['appearance', 'sidebar_state'];
const PREFERENCE_STORAGE_KEYS = ['appearance', 'pwa-install-dismissed-at', 'messenger-prompt-dismissed-until'];

/** The raw cookie value: a stable snapshot for useSyncExternalStore. */
export function consentCookieValue(): string {
    if (typeof document === 'undefined') {
        return '';
    }

    return document.cookie.match(/(?:^|;\s*)cookie_consent=([^;]*)/)?.[1] ?? '';
}

export function parseConsent(raw: string): StoredConsent | null {
    if (!raw) {
        return null;
    }

    try {
        const parsed: unknown = JSON.parse(decodeURIComponent(raw));

        if (typeof parsed !== 'object' || parsed === null) {
            return null;
        }

        const data = parsed as Record<string, unknown>;

        return {
            version: typeof data.v === 'number' ? data.v : 0,
            preferences: data.preferences === true,
            analytics: data.analytics === true,
            decidedAt: typeof data.at === 'string' ? data.at : '',
        };
    } catch {
        return null;
    }
}

/** Whether the visitor has answered the current version of the banner. */
export function hasDecided(): boolean {
    const consent = parseConsent(consentCookieValue());

    return consent !== null && consent.version >= CONSENT_VERSION;
}

export function hasConsent(category: ConsentCategory): boolean {
    return parseConsent(consentCookieValue())?.[category] === true;
}

export function saveConsent(choices: CookieChoices): void {
    const value = encodeURIComponent(
        JSON.stringify({ v: CONSENT_VERSION, ...choices, at: new Date().toISOString() }),
    );
    const secure = window.location.protocol === 'https:' ? ';Secure' : '';

    document.cookie = `${COOKIE_NAME}=${value};path=/;max-age=${MAX_AGE_SECONDS};SameSite=Lax${secure}`;

    // Withdrawing consent means forgetting what was remembered, not only
    // remembering nothing new.
    if (!choices.preferences) {
        clearPreferenceStorage();
    }

    window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeToConsent(callback: () => void): () => void {
    window.addEventListener(CHANGE_EVENT, callback);

    return () => window.removeEventListener(CHANGE_EVENT, callback);
}

/** Reopens the banner from a "Cookie settings" link. */
export function openCookieSettings(): void {
    window.dispatchEvent(new Event(OPEN_EVENT));
}

export function onOpenCookieSettings(callback: () => void): () => void {
    window.addEventListener(OPEN_EVENT, callback);

    return () => window.removeEventListener(OPEN_EVENT, callback);
}

function clearPreferenceStorage(): void {
    for (const name of PREFERENCE_COOKIES) {
        document.cookie = `${name}=;path=/;max-age=0;SameSite=Lax`;
    }

    for (const key of PREFERENCE_STORAGE_KEYS) {
        try {
            window.localStorage.removeItem(key);
        } catch {
            // Storage blocked (private mode): nothing was stored to forget.
        }
    }
}
