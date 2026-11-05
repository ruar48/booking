import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    CalendarDays,
    CircleHelp,
    ExternalLink,
    MapPin,
    Plus,
    RotateCcw,
    Search,
    ShieldCheck,
    Users,
    Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useMemo, useState } from 'react';

import { PageHero } from '@/components/page-hero';
import { openCookieSettings } from '@/lib/cookie-consent';
import { cn } from '@/lib/utils';
import type { FaqLink, FaqQuestion, FaqTopic } from '@/types/legal';

type Props = {
    topics: FaqTopic[];
};

const TOPIC_ICONS: Record<string, LucideIcon> = {
    booking: CalendarDays,
    payment: Wallet,
    changes: RotateCcw,
    'open-play': Users,
    venue: MapPin,
    privacy: ShieldCheck,
};

function matches(item: FaqQuestion, needle: string): boolean {
    return [item.question, item.answer, ...(item.bullets ?? [])].some((text) =>
        text.toLowerCase().includes(needle),
    );
}

export default function Faq({ topics }: Props) {
    const [activeId, setActiveId] = useState(topics[0]?.id ?? '');
    const [query, setQuery] = useState('');

    const total = topics.reduce(
        (count, topic) => count + topic.questions.length,
        0,
    );
    const needle = query.trim().toLowerCase();
    const results = useMemo(
        () =>
            needle
                ? topics
                      .map((topic) => ({
                          ...topic,
                          questions: topic.questions.filter((item) =>
                              matches(item, needle),
                          ),
                      }))
                      .filter((topic) => topic.questions.length > 0)
                : null,
        [topics, needle],
    );
    const active = topics.find((topic) => topic.id === activeId) ?? topics[0];
    const resultCount =
        results?.reduce((count, topic) => count + topic.questions.length, 0) ??
        0;

    // Lets search engines show answers directly (schema.org FAQPage).
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: topics.flatMap((topic) =>
            topic.questions.map((item) => ({
                '@type': 'Question',
                name: item.question,
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: [item.answer, ...(item.bullets ?? [])].join('\n'),
                },
            })),
        ),
    };

    return (
        <>
            <Head title="Frequently asked questions">
                <meta
                    name="description"
                    content="Answers about booking courts, rates, paying with QR Ph, cancellations, Open Play, court rules and your privacy."
                />
                <script type="application/ld+json">
                    {JSON.stringify(structuredData)}
                </script>
            </Head>

            <PageHero
                eyebrow="Help centre"
                title="Questions,"
                accent="answered."
                lede="Courts, payments, Open Play and house rules in one place. Can't find it? The chat button at the bottom of the page is one tap away."
            >
                <div>
                    <p className="text-3xl font-extrabold">{total}</p>
                    <p className="mt-1 text-xs font-semibold tracking-widest text-white/60 uppercase">
                        Answers
                    </p>
                </div>
                <div>
                    <p className="text-3xl font-extrabold">{topics.length}</p>
                    <p className="mt-1 text-xs font-semibold tracking-widest text-white/60 uppercase">
                        Topics
                    </p>
                </div>
            </PageHero>

            {/* grid-cols-1 (minmax(0, 1fr)), not the implicit auto column: the
                topic chips are one long row on phones and would widen the page. */}
            <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-12 lg:px-8 lg:py-14">
                <aside className="min-w-0 space-y-4 lg:sticky lg:top-28 lg:self-start">
                    <label className="relative block">
                        <span className="sr-only">Search questions</span>
                        <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="search"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search questions"
                            className="h-12 w-full rounded-full border border-slate-200 bg-white pr-4 pl-11 text-sm text-brand-navy shadow-sm outline-none placeholder:text-slate-400 focus:border-brand-court focus:ring-2 focus:ring-brand-court/20"
                        />
                    </label>

                    <nav
                        aria-label="FAQ topics"
                        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0"
                    >
                        {topics.map((topic) => {
                            const Icon = TOPIC_ICONS[topic.id] ?? CircleHelp;
                            const selected =
                                !results && topic.id === active?.id;

                            return (
                                <button
                                    key={topic.id}
                                    type="button"
                                    onClick={() => {
                                        setQuery('');
                                        setActiveId(topic.id);
                                    }}
                                    aria-current={selected ? 'true' : undefined}
                                    className={cn(
                                        'flex shrink-0 items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-colors',
                                        selected
                                            ? 'border-brand-lime bg-brand-lime/20 text-brand-navy'
                                            : 'border-transparent text-slate-600 hover:bg-white',
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'flex size-8 shrink-0 items-center justify-center rounded-lg',
                                            selected
                                                ? 'bg-brand-lime text-brand-navy'
                                                : 'bg-white text-slate-500 ring-1 ring-slate-200',
                                        )}
                                    >
                                        <Icon className="size-4" />
                                    </span>
                                    <span className="flex-1 whitespace-nowrap">
                                        {topic.title}
                                    </span>
                                    <span className="text-xs text-slate-400">
                                        {topic.questions.length}
                                    </span>
                                </button>
                            );
                        })}
                    </nav>
                </aside>

                <div className="min-w-0">
                    {results ? (
                        <div className="space-y-10">
                            <p className="text-sm text-slate-600" role="status">
                                {resultCount === 0
                                    ? `No answers match “${query.trim()}”. Try another word, or ask us in the chat.`
                                    : `${resultCount} ${resultCount === 1 ? 'answer matches' : 'answers match'} “${query.trim()}”.`}
                            </p>
                            {results.map((topic) => (
                                <TopicQuestions
                                    key={topic.id}
                                    topic={topic}
                                    open
                                />
                            ))}
                        </div>
                    ) : active ? (
                        <TopicQuestions topic={active} />
                    ) : null}
                </div>
            </div>
        </>
    );
}

function TopicQuestions({
    topic,
    open = false,
}: {
    topic: FaqTopic;
    open?: boolean;
}) {
    const Icon = TOPIC_ICONS[topic.id] ?? CircleHelp;

    return (
        <section aria-labelledby={`topic-${topic.id}`}>
            <div className="flex items-center gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-lime text-brand-navy shadow-sm">
                    <Icon className="size-6" />
                </span>
                <div>
                    <h2
                        id={`topic-${topic.id}`}
                        className="text-2xl font-black tracking-tight text-brand-navy uppercase sm:text-3xl"
                    >
                        {topic.title}
                    </h2>
                    <p className="text-sm text-slate-500">
                        {topic.description}
                    </p>
                </div>
            </div>
            <div className="mt-6 space-y-3">
                {topic.questions.map((item) => (
                    <details
                        key={item.id}
                        id={item.id}
                        open={open}
                        className="group scroll-mt-28 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 open:ring-brand-court/40"
                    >
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-base font-semibold text-brand-navy [&::-webkit-details-marker]:hidden">
                            {item.question}
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-lime/30 transition-transform group-open:rotate-45">
                                <Plus className="size-4" />
                            </span>
                        </summary>
                        <div className="space-y-3 px-5 pb-5 text-[15px] leading-relaxed text-slate-700">
                            {item.answer.split('\n\n').map((paragraph) => (
                                <p key={paragraph}>{paragraph}</p>
                            ))}
                            {item.bullets && item.bullets.length > 0 ? (
                                <ul className="list-disc space-y-1.5 pl-5 marker:text-brand-court">
                                    {item.bullets.map((bullet) => (
                                        <li key={bullet}>{bullet}</li>
                                    ))}
                                </ul>
                            ) : null}
                            {item.link ? <AnswerLink link={item.link} /> : null}
                        </div>
                    </details>
                ))}
            </div>
        </section>
    );
}

function AnswerLink({ link }: { link: FaqLink }) {
    const className =
        'inline-flex items-center gap-1.5 text-sm font-semibold text-brand-court underline-offset-4 hover:underline';

    if ('action' in link) {
        return (
            <button
                type="button"
                onClick={openCookieSettings}
                className={className}
            >
                {link.label}
                <ArrowRight className="size-4" />
            </button>
        );
    }

    // Internal pages navigate in place; anything else (directions) opens a new tab.
    if (link.href.startsWith('/')) {
        return (
            <Link href={link.href} className={className}>
                {link.label}
                <ArrowRight className="size-4" />
            </Link>
        );
    }

    return (
        <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className={className}
        >
            {link.label}
            <ExternalLink className="size-4" />
        </a>
    );
}
