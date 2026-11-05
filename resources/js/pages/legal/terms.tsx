import { Head, Link } from '@inertiajs/react';

import { BusinessDetails, LegalDocument } from '@/components/legal-document';
import type { LegalSection } from '@/components/legal-document';
import { formatCurrency } from '@/lib/format';
import { privacy } from '@/routes/legal';
import type { BusinessIdentity, LegalDocumentMeta } from '@/types/legal';

/*
 * The wording below is the Terms of Service. When it changes in substance,
 * bump `terms.version` and `terms.effective_at` in config/legal.php: sign-ups
 * record the version they accepted.
 */

type Props = {
    business: BusinessIdentity;
    document: LegalDocumentMeta;
    holdMinutes: number | null;
    convenienceFee: { percent: number; fixed: number };
    eveningRateFrom: string;
    /** The live Payment and Booking Policy, agreed to again at checkout. */
    bookingPolicy: string[];
    courtRules: string[];
};

function feeDescription({ percent, fixed }: Props['convenienceFee']): string | null {
    if (percent <= 0 && fixed <= 0) {
        return null;
    }

    const parts = [
        percent > 0 ? `about ${Number(percent.toFixed(2))}% of the booking amount` : null,
        fixed > 0 ? `${formatCurrency(fixed)}` : null,
    ].filter(Boolean);

    return parts.join(' plus ');
}

export default function Terms({
    business,
    document: meta,
    holdMinutes,
    convenienceFee,
    eveningRateFrom,
    bookingPolicy,
    courtRules,
}: Props) {
    const fee = feeDescription(convenienceFee);

    const sections: LegalSection[] = [
        {
            id: 'acceptance',
            title: 'About these terms',
            content: (
                <>
                    <p>
                        These Terms of Service (&ldquo;Terms&rdquo;) are an agreement between you and {business.name}
                        {business.legal_name ? ` (${business.legal_name})` : ''} (&ldquo;we&rdquo;, &ldquo;us&rdquo;) for
                        using our website and web app, and for booking and playing at our courts.
                    </p>
                    <p>
                        You accept these Terms when you create an account, make or pay for a booking, or register for
                        Open Play — or, for a booking made at our counter, when you confirm it with our staff. If you
                        don&apos;t agree with them, please don&apos;t book or use our services.
                    </p>
                    <p>
                        How we handle your personal data is explained in our <Link href={privacy()}>Privacy Notice</Link>.
                    </p>
                </>
            ),
        },
        {
            id: 'about-us',
            title: 'Who we are',
            content: <BusinessDetails business={business} />,
        },
        {
            id: 'accounts',
            title: 'Your account',
            content: (
                <ul>
                    <li>
                        You need an account to book online. Accounts are for people aged 18 and over; younger players
                        are welcome when a parent or guardian books for them and takes responsibility for them.
                    </li>
                    <li>Give us true, current details and keep them up to date in your settings.</li>
                    <li>
                        Keep your password private. You are responsible for bookings made through your account, so
                        tell us right away if you think someone else has used it.
                    </li>
                    <li>One person per account. Don&apos;t book in someone else&apos;s name without their permission.</li>
                    <li>
                        We may suspend or close an account used for fake or abusive bookings, fraud, or to break these
                        Terms.
                    </li>
                </ul>
            ),
        },
        {
            id: 'bookings',
            title: 'Bookings and holds',
            content: (
                <ul>
                    <li>
                        Choose an open court and time on our schedule. Opening hours are set day by day, and times you
                        can&apos;t book are shown as unavailable.
                    </li>
                    <li>
                        When you book, we hold the slot while you pay
                        {holdMinutes !== null ? <> — for <strong>{holdMinutes} minutes</strong></> : null}. If payment
                        isn&apos;t completed in time, the booking is cancelled automatically and the slot is released to
                        other players.
                    </li>
                    <li>
                        A booking is confirmed only once full payment is received; your e-receipt appears on screen as
                        soon as it is.
                    </li>
                    <li>
                        Check the court, date and time carefully before you pay — see{' '}
                        <a href="#cancellations">Cancellations, changes and refunds</a>.
                    </li>
                </ul>
            ),
        },
        {
            id: 'payment',
            title: 'Prices and payment',
            content: (
                <ul>
                    <li>
                        Court rates are per hour and are shown before you book. Some courts charge an evening rate from{' '}
                        {eveningRateFrom}; a booking that runs into the evening is charged at each rate for the time in
                        it.
                    </li>
                    <li>
                        Online payments are made with QR Ph and processed by our payment provider, PayMongo. You pay in
                        your own banking or e-wallet app — we never receive your card, bank or e-wallet credentials.
                    </li>
                    <li>
                        {fee
                            ? `Online payments include a convenience fee of ${fee}, which covers what the payment provider charges us. It is shown as a separate line, with the total, before you pay.`
                            : 'We do not add a convenience fee to online payments.'}
                    </li>
                    <li>All prices are in Philippine pesos.</li>
                </ul>
            ),
        },
        {
            id: 'cancellations',
            title: 'Cancellations, changes and refunds',
            content: (
                <>
                    {bookingPolicy.length > 0 ? (
                        <>
                            <p>Our Payment and Booking Policy, which you also agree to at checkout:</p>
                            <ul>
                                {bookingPolicy.map((line) => (
                                    <li key={line}>{line}</li>
                                ))}
                            </ul>
                        </>
                    ) : null}
                    <h3>If we cancel</h3>
                    <p>
                        If we cancel your booking or can&apos;t provide your court — for example because of severe
                        weather, a typhoon signal, a power interruption, a problem with the facility or an order from
                        the authorities — you get a <strong>full refund</strong> of what you paid.
                    </p>
                    <h3>Payment problems</h3>
                    <ul>
                        <li>If the same booking is paid twice, the extra payment is refunded.</li>
                        <li>
                            If your payment arrives after your hold ran out, we restore your booking as long as the slot
                            is still free. If someone else has booked it in the meantime, your payment is refunded in
                            full.
                        </li>
                    </ul>
                    <p>
                        Refunds go back through our payment provider to the account you paid from, or by another method
                        we agree with you. How long they take to arrive depends on your bank or e-wallet.
                    </p>
                    <p>
                        Nothing in these Terms takes away your rights under the Consumer Act of the Philippines
                        (Republic Act No. 7394) or other laws that protect consumers.
                    </p>
                </>
            ),
        },
        {
            id: 'open-play',
            title: 'Open Play',
            content: (
                <ul>
                    <li>
                        Open Play sessions are joined per player. Your spot is confirmed once your fee is paid; sessions
                        can fill up, and registration can close before the session starts.
                    </li>
                    <li>To join, your profile needs your birthdate.</li>
                    <li>
                        You may register friends and pay for them. By doing so you confirm that they have agreed to be
                        registered and to these Terms.
                    </li>
                    <li>
                        The organizers set the pairings, brackets and format, and may adjust them on the day. If we
                        cancel a session, registered players get a full refund.
                    </li>
                </ul>
            ),
        },
        {
            id: 'house-rules',
            title: 'Court rules and use of the facilities',
            content: (
                <>
                    {courtRules.length > 0 ? (
                        <ul>
                            {courtRules.map((rule) => (
                                <li key={rule}>{rule}</li>
                            ))}
                        </ul>
                    ) : (
                        <p>Please follow the rules posted at the venue.</p>
                    )}
                    <p>
                        Please also follow our staff&apos;s instructions. We may ask anyone who breaks these rules,
                        damages the facilities or puts others at risk to leave, in which case the rest of their booked
                        time is forfeited.
                    </p>
                </>
            ),
        },
        {
            id: 'rentals',
            title: 'Equipment rental',
            content: (
                <p>
                    Rented paddles, balls and other equipment must be returned at the end of your rental in the
                    condition you received them. Damage beyond normal wear, or loss, is charged at the cost of repair or
                    replacement.
                </p>
            ),
        },
        {
            id: 'safety',
            title: 'Health, safety and your belongings',
            content: (
                <ul>
                    <li>
                        Pickleball and our other sports are physical activities that carry a risk of injury. Play within
                        your ability, warm up, and tell our staff right away about any injury or hazard.
                    </li>
                    <li>We take reasonable care to keep the courts and facilities safe and in good repair.</li>
                    <li>
                        Please look after your belongings. We are not responsible for personal items that are lost,
                        stolen or damaged, unless that is caused by our fault.
                    </li>
                </ul>
            ),
        },
        {
            id: 'photos',
            title: 'Photos at the venue',
            content: (
                <p>
                    We sometimes take photos and videos of play and events for our gallery and social media pages. If
                    you&apos;d rather not appear, tell our staff; if you appear in something we have published, ask us
                    and we&apos;ll take it down.
                </p>
            ),
        },
        {
            id: 'website',
            title: 'Using our website',
            content: (
                <ul>
                    <li>
                        Don&apos;t misuse the site: no false bookings, no attempts to get around payment, and no
                        attempts to overload, probe or break our systems or to copy the schedule automatically.
                    </li>
                    <li>Our name, logo and site content belong to us; don&apos;t reuse them commercially without permission.</li>
                </ul>
            ),
        },
        {
            id: 'liability',
            title: 'Our responsibility to you',
            content: (
                <>
                    <p>
                        We provide the courts and services described when you book, with reasonable care. If we fail to
                        provide a booking you paid for, our responsibility is to refund what you paid for it, unless the
                        law gives you more.
                    </p>
                    <p>
                        Nothing in these Terms excludes or limits our liability where Philippine law does not allow it,
                        including liability for fraud, bad faith or gross negligence.
                    </p>
                </>
            ),
        },
        {
            id: 'changes',
            title: 'Changes to these terms',
            content: (
                <p>
                    We may update these Terms, for example when our services or the law change. The version and
                    effective date are shown at the top of this page. If a change materially affects you, we&apos;ll
                    tell registered users through the site or by email before it takes effect. Changes never apply to
                    bookings you have already paid for.
                </p>
            ),
        },
        {
            id: 'law',
            title: 'Governing law and disputes',
            content: (
                <>
                    <p>These Terms are governed by the laws of the Republic of the Philippines.</p>
                    <p>
                        If something goes wrong, please talk to us first — most problems are solved quickly at the
                        counter or by message. You may also bring a consumer complaint to the Department of Trade and
                        Industry (DTI). Court cases are to be filed in the proper courts of the province where our venue
                        is located.
                    </p>
                </>
            ),
        },
        {
            id: 'contact',
            title: 'Contact us',
            content: (
                <>
                    <p>Questions about these Terms or a booking? Reach us at:</p>
                    <BusinessDetails business={business} />
                </>
            ),
        },
    ];

    return (
        <>
            <Head title="Terms of Service">
                <meta
                    name="description"
                    content={`How booking, payment, cancellations and court rules work at ${business.name}.`}
                />
            </Head>
            <LegalDocument
                eyebrow="Legal"
                title="Terms of"
                accent="Service."
                lede={`How booking and playing at ${business.name} works: payments and holds, what happens if plans change, and what we each expect of the other.`}
                summary="Book with accurate details and pay within the hold time, and your court is confirmed. Paid bookings are final unless we cancel — then you get a full refund. Follow the court rules, play safe, and talk to us first if anything goes wrong."
                meta={meta}
                highlights={[
                    ...(holdMinutes !== null ? [{ value: `${holdMinutes} min`, label: 'Payment hold' }] : []),
                    { value: 'Full refund', label: 'If we cancel' },
                ]}
                sections={sections}
                related={{ label: 'Read the Privacy Notice', href: privacy().url }}
            />
        </>
    );
}
