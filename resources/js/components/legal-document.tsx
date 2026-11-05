import { Link } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { ArrowRight, ChevronDown, Printer, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

import { PageHero } from '@/components/page-hero';
import { openCookieSettings } from '@/lib/cookie-consent';
import { cn } from '@/lib/utils';
import type { BusinessIdentity, LegalDocumentMeta } from '@/types/legal';

/** Who we are and how to reach us — the details both documents must state. */
export function BusinessDetails({ business }: { business: BusinessIdentity }) {
    const rows: [string, React.ReactNode][] = [
        ['Business name', business.name],
        ['Registered name', business.legal_name],
        ['Registration no.', business.registration_number],
        ['Address', business.address],
        [
            'Phone',
            business.phone ? (
                <a href={`tel:${business.phone.replace(/[^\d+]/g, '')}`}>
                    {business.phone}
                </a>
            ) : null,
        ],
        [
            'Email',
            business.email ? (
                <a href={`mailto:${business.email}`}>{business.email}</a>
            ) : null,
        ],
    ];

    return (
        <dl className="grid gap-x-6 gap-y-2 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200 sm:grid-cols-[10rem_1fr]">
            {rows
                .filter(([, value]) => value)
                .map(([label, value]) => (
                    <div key={label} className="contents">
                        <dt className="text-sm font-semibold text-brand-navy">
                            {label}
                        </dt>
                        <dd className="text-sm">{value}</dd>
                    </div>
                ))}
        </dl>
    );
}

export type LegalSection = {
    id: string;
    title: string;
    content: React.ReactNode;
};

/**
 * Shared frame for the Terms of Service and Privacy Notice: the effective date
 * and version up front, a summary in plain words, then numbered sections with
 * an "On this page" index that follows the reader.
 */
export function LegalDocument({
    eyebrow,
    title,
    accent,
    lede,
    summary,
    meta,
    highlights,
    sections,
    related,
}: {
    eyebrow: string;
    title: string;
    accent: string;
    lede: string;
    summary: string;
    meta: LegalDocumentMeta;
    /** Key facts next to the effective date, e.g. "60 min · Payment hold". */
    highlights: { value: string; label: string }[];
    sections: LegalSection[];
    related: { label: string; href: string };
}) {
    const active = useActiveSection(
        sections.map((section) => section.id).join('|'),
    );
    const effective = parseISO(meta.effectiveAt);

    return (
        <>
            <PageHero
                eyebrow={eyebrow}
                title={title}
                accent={accent}
                lede={lede}
            >
                <div>
                    <p className="text-2xl font-extrabold uppercase sm:text-3xl">
                        {format(effective, 'MMM d, yyyy')}
                    </p>
                    <p className="mt-1 text-xs font-semibold tracking-widest text-white/60 uppercase">
                        Effective
                    </p>
                </div>
                {highlights.map((highlight) => (
                    <div key={highlight.label}>
                        <p className="text-2xl font-extrabold uppercase sm:text-3xl">
                            {highlight.value}
                        </p>
                        <p className="mt-1 text-xs font-semibold tracking-widest text-white/60 uppercase">
                            {highlight.label}
                        </p>
                    </div>
                ))}
                <button
                    type="button"
                    onClick={() => window.print()}
                    className="ml-auto inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/10 print:hidden"
                >
                    <Printer className="size-4" />
                    Print or save as PDF
                </button>
            </PageHero>

            <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12 lg:px-8 lg:py-14">
                <aside className="min-w-0 print:hidden">
                    {/* Phones: a collapsed index above the text. */}
                    <details className="group rounded-xl border border-slate-200 bg-white lg:hidden">
                        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold">
                            On this page
                            <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
                        </summary>
                        <TableOfContents
                            sections={sections}
                            active={active}
                            className="px-2 pb-3"
                        />
                    </details>

                    <div className="sticky top-28 hidden lg:block">
                        <p className="flex items-center gap-3 text-xs font-bold tracking-widest text-brand-court uppercase">
                            <span
                                className="h-px w-6 bg-brand-court"
                                aria-hidden
                            />
                            On this page
                        </p>
                        <TableOfContents
                            sections={sections}
                            active={active}
                            className="mt-4 border-l border-slate-200"
                        />
                        <div className="mt-8 space-y-3">
                            <Link
                                href={related.href}
                                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium transition-colors hover:border-brand-court hover:text-brand-court"
                            >
                                {related.label}
                                <ArrowRight className="size-4" />
                            </Link>
                            <button
                                type="button"
                                onClick={openCookieSettings}
                                className="block px-1 text-sm font-medium text-brand-court underline-offset-4 hover:underline"
                            >
                                Cookie settings
                            </button>
                        </div>
                    </div>
                </aside>

                <article className="min-w-0">
                    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
                        <p className="flex items-center gap-2 text-xs font-bold tracking-widest text-slate-500 uppercase">
                            <Sparkles className="size-4 text-brand-court" />
                            In short
                        </p>
                        <p className="mt-3 text-lg leading-relaxed text-brand-navy sm:text-xl">
                            {summary}
                        </p>
                        <p className="mt-4 text-xs text-slate-500">
                            Version {meta.version} · effective{' '}
                            {format(effective, 'EEEE, MMMM d, yyyy')}
                        </p>
                    </div>

                    <div className="mt-10 space-y-12">
                        {sections.map((section, index) => (
                            <section
                                key={section.id}
                                id={section.id}
                                className="scroll-mt-28"
                            >
                                <h2 className="flex items-baseline gap-3 text-xl font-bold text-brand-navy sm:text-2xl">
                                    <span className="font-mono text-xs font-semibold text-brand-court">
                                        {String(index + 1).padStart(2, '0')}
                                    </span>
                                    {section.title}
                                </h2>
                                <div className="legal-prose mt-3 text-[15px] leading-relaxed text-slate-700">
                                    {section.content}
                                </div>
                            </section>
                        ))}
                    </div>

                    <div className="mt-12 flex flex-wrap gap-3 border-t border-slate-200 pt-6 lg:hidden print:hidden">
                        <Link
                            href={related.href}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium"
                        >
                            {related.label}
                            <ArrowRight className="size-4" />
                        </Link>
                        <button
                            type="button"
                            onClick={openCookieSettings}
                            className="rounded-full px-4 py-2 text-sm font-medium text-brand-court"
                        >
                            Cookie settings
                        </button>
                    </div>
                </article>
            </div>
        </>
    );
}

function TableOfContents({
    sections,
    active,
    className,
}: {
    sections: LegalSection[];
    active: string | null;
    className?: string;
}) {
    return (
        <ol className={cn('space-y-0.5', className)}>
            {sections.map((section, index) => (
                <li key={section.id}>
                    <a
                        href={`#${section.id}`}
                        aria-current={
                            active === section.id ? 'location' : undefined
                        }
                        className={cn(
                            '-ml-px flex gap-3 border-l-2 border-transparent py-1.5 pr-2 pl-4 text-sm leading-snug text-slate-600 transition-colors hover:text-brand-navy',
                            active === section.id &&
                                'border-brand-lime font-semibold text-brand-navy',
                        )}
                    >
                        <span className="font-mono text-xs text-slate-400">
                            {String(index + 1).padStart(2, '0')}
                        </span>
                        {section.title}
                    </a>
                </li>
            ))}
        </ol>
    );
}

/** The section the reader is in, for the index highlight. */
function useActiveSection(idList: string): string | null {
    const [active, setActive] = useState<string | null>(null);

    useEffect(() => {
        const elements = idList
            .split('|')
            .map((id) => document.getElementById(id))
            .filter((element): element is HTMLElement => element !== null);

        // A band near the top of the screen: the section crossing it is "current".
        const observer = new IntersectionObserver(
            (entries) => {
                const current = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort(
                        (a, b) =>
                            a.boundingClientRect.top - b.boundingClientRect.top,
                    )[0];

                if (current) {
                    setActive(current.target.id);
                }
            },
            { rootMargin: '-20% 0px -70% 0px' },
        );

        elements.forEach((element) => observer.observe(element));

        return () => observer.disconnect();
    }, [idList]);

    return active;
}
