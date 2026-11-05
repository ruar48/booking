import { Link } from '@inertiajs/react';
import {
    Baby,
    CigaretteOff,
    CircleCheck,
    Clock,
    Footprints,
    PawPrint,
    Recycle,
    ShieldAlert,
    Users,
    WineOff,
    Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { terms } from '@/routes/legal';

/** Rules are free text an admin writes, so the icon is picked by keyword. */
function ruleIcon(rule: string): LucideIcon {
    const text = rule.toLowerCase();
    const icons: [RegExp, LucideIcon][] = [
        [/shoe|footwear|sole/, Footprints],
        [/smok|vap|cigar/, CigaretteOff],
        [/alcohol|liquor|beer|drunk/, WineOff],
        [/child|kid|minor|guardian/, Baby],
        [/pet|dog|animal/, PawPrint],
        // Before the equipment rule: "report any injury or damage to staff" is about safety.
        [/staff|injur|safety|emergenc/, ShieldAlert],
        [/paddle|ball|rent|damage|equipment|replacement/, Wrench],
        [/clean|trash|litter|bin|garbage/, Recycle],
        [/time|slot|hour|minute|warm-?up|late/, Clock],
        [/person|people|player|guest|maximum|max\b/, Users],
    ];

    return icons.find(([pattern]) => pattern.test(text))?.[1] ?? CircleCheck;
}

/**
 * The venue's house rules (Policies with the "court rules" placement).
 *
 * `tone="site"` matches the public home page, which keeps its light palette
 * whatever the visitor's theme; the default follows the app theme.
 */
export function CourtRules({
    rules,
    tone = 'app',
    className,
}: {
    rules: string[];
    tone?: 'app' | 'site';
    className?: string;
}) {
    if (rules.length === 0) {
        return null;
    }

    const site = tone === 'site';

    return (
        <section
            aria-labelledby="court-rules-heading"
            className={cn(
                // A container, so the rules split into two columns by the card's own width, beside the rates card or not.
                '@container rounded-2xl border p-5',
                site
                    ? 'border-slate-200 bg-white text-brand-navy'
                    : 'bg-card text-card-foreground',
                className,
            )}
        >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2
                    id="court-rules-heading"
                    className={cn(
                        'text-xs font-bold tracking-widest uppercase',
                        site ? 'text-slate-500' : 'text-muted-foreground',
                    )}
                >
                    Court rules &amp; policies
                </h2>
                <Link
                    href={`${terms().url}#house-rules`}
                    className={cn(
                        'text-xs font-medium underline-offset-4 hover:underline',
                        site ? 'text-brand-court' : 'text-primary',
                    )}
                >
                    Full terms
                </Link>
            </div>
            <ul className="mt-4 grid gap-x-8 gap-y-4 @lg:grid-cols-2">
                {rules.map((rule) => {
                    const Icon = ruleIcon(rule);

                    return (
                        <li key={rule} className="flex items-start gap-3">
                            <span
                                className={cn(
                                    'flex size-9 shrink-0 items-center justify-center rounded-lg',
                                    site
                                        ? 'bg-slate-100 text-brand-navy'
                                        : 'bg-muted text-foreground',
                                )}
                            >
                                <Icon className="size-4" />
                            </span>
                            <span className="pt-1.5 text-sm leading-snug">
                                {rule}
                            </span>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
