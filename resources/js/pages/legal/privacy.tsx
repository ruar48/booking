import { Head, Link } from '@inertiajs/react';

import { BusinessDetails, LegalDocument } from '@/components/legal-document';
import type { LegalSection } from '@/components/legal-document';
import { openCookieSettings } from '@/lib/cookie-consent';
import { terms } from '@/routes/legal';
import type { BusinessIdentity, LegalDocumentMeta } from '@/types/legal';

/*
 * The wording below is the Privacy Notice required by the Data Privacy Act of
 * 2012 (RA 10173). It describes what this app actually does — keep it in step
 * with the code, and when it changes in substance bump `privacy.version` and
 * `privacy.effective_at` in config/legal.php.
 */

type Props = {
    business: BusinessIdentity;
    document: LegalDocumentMeta;
    retention: {
        pageViewDays: number;
        loginHistoryDays: number;
        sessionMinutes: number;
    };
};

function Purpose({ title, basis, children }: { title: string; basis: string; children: React.ReactNode }) {
    return (
        <li>
            <strong>{title}.</strong> {children} <em className="text-slate-500 not-italic">Basis: {basis}.</em>
        </li>
    );
}

export default function Privacy({ business, document: meta, retention }: Props) {
    const dpo = business.dpo_name ? `our Data Protection Officer, ${business.dpo_name}` : 'our Data Protection Officer';

    const sections: LegalSection[] = [
        {
            id: 'controller',
            title: 'Who we are',
            content: (
                <>
                    <p>
                        {business.name}
                        {business.legal_name ? ` (${business.legal_name})` : ''}
                        {business.address ? `, ${business.address},` : ''} (&ldquo;we&rdquo;, &ldquo;us&rdquo;) is the
                        personal information controller for the personal data processed through this website and web
                        app, at our counter, and in our messages to you, under the Data Privacy Act of 2012 (Republic
                        Act No. 10173), its Implementing Rules and Regulations, and the rules of the National Privacy
                        Commission (NPC).
                    </p>
                    <BusinessDetails business={business} />
                </>
            ),
        },
        {
            id: 'dpo',
            title: 'Our Data Protection Officer',
            content: (
                <p>
                    Questions, requests and complaints about your personal data go to {dpo}
                    {business.dpo_email ? (
                        <>
                            {' '}
                            at <a href={`mailto:${business.dpo_email}`}>{business.dpo_email}</a>
                        </>
                    ) : null}
                    , or in person at our counter, marked &ldquo;Attention: Data Protection Officer&rdquo;.
                </p>
            ),
        },
        {
            id: 'data',
            title: 'The personal data we collect',
            content: (
                <ul>
                    <li>
                        <strong>Account:</strong> your name and email address, your password (stored only as a one-way
                        hash, never readable), and optionally your mobile number and profile photo. If you turn them on,
                        your two-factor authentication and passkey settings.
                    </li>
                    <li>
                        <strong>Player profile:</strong> filled in by you, or by our staff at your request — birthdate,
                        gender, playing hand, skill level, mobile number, address, an emergency contact and a short bio.
                        All optional, except that Open Play needs your birthdate.
                    </li>
                    <li>
                        <strong>Bookings and Open Play:</strong> the courts, dates and times you book, amounts and
                        status, the partner or friends you register for Open Play, and pairings and match results.
                    </li>
                    <li>
                        <strong>Payments:</strong> amount, convenience fee, invoice number, payment method, status and
                        time. When you pay online we also record that you agreed to our payment policy and Terms of
                        Service: which versions, when, and the IP address and browser you used, kept with that payment
                        as proof of what was agreed. To create your QR Ph payment we give our payment provider your name
                        and email address. We never receive your card, bank or e-wallet credentials.
                    </li>
                    <li>
                        <strong>Rentals and counter purchases:</strong> what you rent or buy and the amounts, when our
                        staff record it under your account.
                    </li>
                    <li>
                        <strong>Device and security records:</strong> your IP address and browser or device type, when
                        you sign in (login history), your active sessions, and a log of changes our staff make to
                        bookings, payments and other records.
                    </li>
                    <li>
                        <strong>Site usage:</strong> anonymous counts of the pages people open. Only if you allow
                        analytics: a daily visitor code worked out from your IP address and browser (the IP itself is
                        not stored) and, while you&apos;re signed in, which pages you open.
                    </li>
                    <li>
                        <strong>Messages:</strong> the notifications we send you in the app and by email. Questions you
                        type in the support chat are answered automatically on our server and are not saved.
                    </li>
                    <li>
                        <strong>Facebook Messenger:</strong> when you message our Facebook Page, Meta gives us your
                        Page-scoped ID (a number that identifies you only to our Page), your messages and any photos or
                        files you send, and — where Meta allows it — your name and profile picture. We also record when
                        our messages to you are delivered and seen. If you connect Messenger in your account settings,
                        we link that ID to your account so booking updates can reach you there.
                    </li>
                    <li>
                        <strong>Photos:</strong> photos or videos taken at the venue that we may publish in our gallery or
                        on social media.
                    </li>
                    <li>
                        <strong>About other people:</strong> when you register friends for Open Play you give us their
                        names as they appear on their accounts. Please only register people who have agreed to it.
                    </li>
                </ul>
            ),
        },
        {
            id: 'purposes',
            title: 'Why we use it, and on what basis',
            content: (
                <>
                    <p>
                        We use personal data only for these purposes, and each one rests on a ground allowed by Sections
                        12 and 13 of the Data Privacy Act:
                    </p>
                    <ul>
                        <Purpose title="Your account" basis="our contract with you">
                            Creating it, signing you in and keeping your details.
                        </Purpose>
                        <Purpose title="Bookings, Open Play and rentals" basis="our contract with you">
                            Taking, confirming and managing them, and checking you in at the counter.
                        </Purpose>
                        <Purpose title="Payments and refunds" basis="our contract with you, and our legal obligations to keep financial records">
                            Collecting payment, issuing your e-receipt, handling refunds, and keeping proof of what you
                            agreed to before paying.
                        </Purpose>
                        <Purpose title="Booking messages" basis="our contract with you">
                            Confirmations, reminders and payment receipts about your bookings.
                        </Purpose>
                        <Purpose title="Messenger" basis="your consent, given when you message our Page or connect Messenger">
                            Answering the messages you send our Facebook Page, sending booking updates to Messenger once
                            you connect it, and telling people who messaged us in the last 24 hours about new Open Play
                            sessions. Disconnect at any time in Settings → Messenger, or block our Page in Messenger.
                        </Purpose>
                        <Purpose title="Security" basis="our legitimate interest in keeping accounts and payments safe">
                            Preventing fraud and misuse, protecting accounts, and keeping a record of changes to bookings
                            and payments.
                        </Purpose>
                        <Purpose title="Open Play age information" basis="your consent, given when you add your birthdate">
                            Showing venue staff each player&apos;s age. Age is sensitive personal information under the
                            Data Privacy Act; we never publish it, and you can remove your birthdate at any time.
                        </Purpose>
                        <Purpose title="Improving the site" basis="your consent, only if you allow analytics">
                            Counting returning visitors and seeing which pages signed-in members use.
                        </Purpose>
                        <Purpose title="Remembering your preferences" basis="your consent">
                            Your theme and display choices, and showing the embedded map.
                        </Purpose>
                        <Purpose title="Venue photos" basis="our legitimate interest in showing our community">
                            Our gallery and social media. You can object at any time.
                        </Purpose>
                        <Purpose title="The law" basis="legal obligation, and the establishment or defence of legal claims">
                            Complying with tax and other laws, answering lawful requests from the authorities, and
                            protecting our legal rights.
                        </Purpose>
                    </ul>
                    <p>
                        We don&apos;t profile you. The only automated decisions are routine booking rules — for example,
                        an unpaid booking is released automatically when its payment hold runs out.
                    </p>
                </>
            ),
        },
        {
            id: 'sharing',
            title: 'Who we share it with',
            content: (
                <>
                    <ul>
                        <li>
                            <strong>Our staff</strong>, only as far as their role needs.
                        </li>
                        <li>
                            <strong>Service providers</strong> that process data for us, on our instructions only: our
                            web hosting provider (where the site and its database run), PayMongo (payments), Pusher (live
                            updates, such as your payment confirmation appearing on screen), our email delivery
                            provider, Meta (Facebook Messenger — only if you message our Page or connect Messenger; Meta
                            handles those messages under its own privacy policy), and Google — only when you choose to
                            show the embedded map.
                        </li>
                        <li>
                            <strong>Other players</strong>, who see your name on Open Play rosters, brackets and results.
                        </li>
                        <li>
                            <strong>Government agencies, courts and law enforcement</strong>, when the law requires it.
                        </li>
                    </ul>
                    <p>
                        <strong>We do not sell or rent your personal data</strong>, and we don&apos;t use it for
                        advertising by others.
                    </p>
                </>
            ),
        },
        {
            id: 'transfers',
            title: 'Data processed outside the Philippines',
            content: (
                <p>
                    Some of our service providers may store or process data on servers outside the Philippines. We
                    remain responsible for your personal data wherever it is processed, as Section 21 of the Data
                    Privacy Act requires, and we only use providers that protect it with appropriate security measures.
                </p>
            ),
        },
        {
            id: 'cookies',
            title: 'Cookies and similar technologies',
            content: (
                <>
                    <p>
                        Cookies are small files your browser keeps for a website. Only the strictly necessary ones are
                        set without asking you; you can change your choices at any time in{' '}
                        <button type="button" onClick={openCookieSettings} className="font-medium text-brand-court underline underline-offset-2">
                            Cookie settings
                        </button>
                        .
                    </p>
                    <h3>Strictly necessary — always on</h3>
                    <ul>
                        <li>
                            <strong>Session cookie</strong> — keeps you signed in and your checkout working. Expires after{' '}
                            {retention.sessionMinutes} minutes of inactivity.
                        </li>
                        <li>
                            <strong>XSRF-TOKEN</strong> — protects forms from cross-site request forgery. Same lifetime
                            as the session.
                        </li>
                        <li>
                            <strong>Remember-me cookie</strong> — only if you tick &ldquo;Remember me&rdquo;; keeps you
                            signed in until you sign out (at most 400 days).
                        </li>
                        <li>
                            <strong>cookie_consent</strong> — remembers your cookie choices for 12 months.
                        </li>
                        <li>
                            <strong>Offline copy</strong> — if you install the app, your browser keeps its files so it
                            opens without a connection. No personal data.
                        </li>
                    </ul>
                    <h3>Preferences — only if you allow them</h3>
                    <ul>
                        <li>
                            <strong>appearance</strong> — your light or dark theme, for 12 months.
                        </li>
                        <li>
                            <strong>sidebar_state</strong> — whether the side menu is open, for 7 days.
                        </li>
                        <li>
                            <strong>Install prompt</strong> — remembers that you closed the &ldquo;install the
                            app&rdquo; prompt, in your browser&apos;s storage.
                        </li>
                        <li>
                            <strong>Google Maps</strong> — the map of our location loads by itself, and Google may set
                            its own cookies under Google&apos;s privacy policy. Without this choice the map shows only
                            when you click it.
                        </li>
                    </ul>
                    <h3>Analytics — only if you allow it</h3>
                    <p>
                        Analytics uses no cookie: we count visits on our own server. With your consent we link page views
                        to a daily visitor code and, when you&apos;re signed in, to your account. Without it, we record
                        only an anonymous page view.
                    </p>
                </>
            ),
        },
        {
            id: 'retention',
            title: 'How long we keep it',
            content: (
                <ul>
                    <li>
                        <strong>Account and profile:</strong> until you delete your account or ask us to delete it.
                    </li>
                    <li>
                        <strong>Bookings, Open Play registrations and payments:</strong> for as long as your account
                        exists. Deleting your account deletes them from this system.
                    </li>
                    <li>
                        <strong>Unpaid bookings:</strong> released when the payment hold runs out, and kept in your
                        booking history as cancelled.
                    </li>
                    <li>
                        <strong>Login history:</strong> {retention.loginHistoryDays} days, then deleted automatically.
                    </li>
                    <li>
                        <strong>Analytics page views:</strong> {retention.pageViewDays} days, then deleted automatically.
                    </li>
                    <li>
                        <strong>Record of staff changes:</strong> kept so that changes to bookings and payments can be
                        accounted for.
                    </li>
                    <li>
                        <strong>Support chat:</strong> not stored.
                    </li>
                    <li>
                        <strong>Messenger chats with our Page:</strong> kept so our staff can see the conversation
                        history, until you ask us to delete them. Disconnecting Messenger unlinks it from your account
                        straight away. Meta keeps its own copy of the chat in Messenger.
                    </li>
                    <li>
                        <strong>Venue photos:</strong> until you ask us to remove them, or we no longer use them.
                    </li>
                </ul>
            ),
        },
        {
            id: 'security',
            title: 'How we protect it',
            content: (
                <>
                    <ul>
                        <li>Encrypted connections (HTTPS) between your device and our site.</li>
                        <li>Passwords stored only as one-way hashes; optional two-factor authentication and passkeys.</li>
                        <li>Staff access limited by role, with changes to bookings and payments logged.</li>
                        <li>
                            Payments handled by PayMongo, so card, bank and e-wallet details never reach our systems.
                        </li>
                    </ul>
                    <p>
                        If a personal data breach is likely to put you at real risk, we will notify you and the NPC as
                        the law requires.
                    </p>
                </>
            ),
        },
        {
            id: 'rights',
            title: 'Your rights',
            content: (
                <>
                    <p>Under the Data Privacy Act you have the right to:</p>
                    <ul>
                        <li>be informed about how your personal data is processed — which is what this notice is for;</li>
                        <li>access the personal data we hold about you;</li>
                        <li>object to processing, including processing based on our legitimate interests;</li>
                        <li>have it corrected if it is inaccurate or incomplete;</li>
                        <li>have it erased or blocked, subject to what the law requires us to keep;</li>
                        <li>get a copy in a commonly used electronic format (data portability);</li>
                        <li>withdraw consent at any time, without affecting what was done before;</li>
                        <li>be indemnified for damages caused by inaccurate, false or unlawfully obtained data; and</li>
                        <li>file a complaint with the National Privacy Commission.</li>
                    </ul>
                    <p>
                        You can do much of this yourself: correct your details in Settings → Profile, sign out other
                        devices in Settings → Sessions, delete your account at the bottom of Settings → Profile, and
                        change cookie choices in Cookie settings. For anything else, contact {dpo}
                        {business.dpo_email ? (
                            <>
                                {' '}
                                at <a href={`mailto:${business.dpo_email}`}>{business.dpo_email}</a>
                            </>
                        ) : null}
                        . We may need to confirm your identity first, and we will respond within the time NPC rules
                        allow.
                    </p>
                    <p>
                        If you&apos;re not satisfied with our answer, you can complain to the National Privacy
                        Commission at{' '}
                        <a href="https://privacy.gov.ph" target="_blank" rel="noopener noreferrer">
                            privacy.gov.ph
                        </a>
                        .
                    </p>
                </>
            ),
        },
        {
            id: 'children',
            title: 'Children',
            content: (
                <p>
                    Our accounts are for people aged 18 and over. Younger players are welcome when a parent or guardian
                    books for them. We don&apos;t knowingly collect a child&apos;s personal data without a parent&apos;s
                    or guardian&apos;s consent; if you believe we have, contact us and we will delete it.
                </p>
            ),
        },
        {
            id: 'changes',
            title: 'Changes to this notice',
            content: (
                <p>
                    We update this notice when our practices or the law change. The version and effective date are
                    shown at the top of this page, and we tell registered users about significant changes through the
                    site or by email before they take effect. Our <Link href={terms()}>Terms of Service</Link> explain
                    how bookings work.
                </p>
            ),
        },
        {
            id: 'contact',
            title: 'Contact us',
            content: (
                <>
                    <p>
                        For anything about your personal data, contact {dpo}
                        {business.dpo_email ? (
                            <>
                                {' '}
                                at <a href={`mailto:${business.dpo_email}`}>{business.dpo_email}</a>
                            </>
                        ) : null}
                        , or reach us at:
                    </p>
                    <BusinessDetails business={business} />
                </>
            ),
        },
    ];

    return (
        <>
            <Head title="Privacy Notice">
                <meta
                    name="description"
                    content={`What personal data ${business.name} collects, why, who it is shared with, how long it is kept and your rights under the Data Privacy Act.`}
                />
            </Head>
            <LegalDocument
                eyebrow="Your data"
                title="Privacy"
                accent="Notice."
                lede="We keep only what your bookings need, never sell it, and let you see, correct or delete it."
                summary="We collect what running your account and bookings requires, use it to provide our services and keep them secure, never sell it, and keep it no longer than we need to. Anything optional — remembering your preferences, analytics, the embedded map — happens only if you say yes."
                meta={meta}
                highlights={[
                    { value: 'Never', label: 'Data sold' },
                    { value: 'RA 10173', label: 'Data Privacy Act' },
                ]}
                sections={sections}
                related={{ label: 'Read the Terms of Service', href: terms().url }}
            />
        </>
    );
}
