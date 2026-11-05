import { PaddleDuel } from '@/components/paddle-duel';

/**
 * The navy band that opens the public site's inner pages (FAQ, Terms,
 * Privacy): eyebrow, headline with a lime accent and a short lede, with the
 * same pickleball rally the home page plays beside the headline, then the
 * page's key facts under a rule.
 */
export function PageHero({
    eyebrow,
    title,
    accent,
    lede,
    children,
}: {
    eyebrow: string;
    title: string;
    accent: string;
    lede: string;
    /** The key facts under the rule. */
    children: React.ReactNode;
}) {
    return (
        <section className="bg-brand-navy-dark text-white">
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
                <div className="grid grid-cols-1 items-center gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] xl:grid-cols-[minmax(0,1fr)_minmax(0,34rem)]">
                    <div className="min-w-0">
                        <p className="flex items-center gap-3 text-xs font-bold tracking-widest text-brand-lime uppercase">
                            <span
                                className="h-px w-8 bg-brand-lime"
                                aria-hidden
                            />
                            {eyebrow}
                        </p>
                        <h1 className="mt-4 text-4xl font-black tracking-tight uppercase sm:text-6xl">
                            {title}{' '}
                            <span className="text-brand-lime">{accent}</span>
                        </h1>
                        <p className="mt-4 max-w-2xl text-base text-white/75 sm:text-lg">
                            {lede}
                        </p>
                    </div>

                    {/* Beside the headline on wide screens, under it on phones. Left off printed copies. */}
                    <PaddleDuel
                        bigCheers
                        className="mx-auto max-w-md lg:max-w-none print:hidden"
                    />
                </div>

                <div className="mt-8 flex flex-wrap items-end gap-x-10 gap-y-6 border-t border-white/15 pt-6">
                    {children}
                </div>
            </div>
        </section>
    );
}
