import { Link, usePage } from '@inertiajs/react';
import { CalendarDays, UserRound } from 'lucide-react';

import { InstallAppButton } from '@/components/install-app-button';
import { Button } from '@/components/ui/button';
import { brand } from '@/lib/brand';
import { cn } from '@/lib/utils';
import { dashboard, home, login } from '@/routes';
import { index as bookingsIndex } from '@/routes/bookings';

/** "Galaang-Ramos Pickleball" → ["Galaang-Ramos", "Pickleball"], for the two-tone wordmark. */
export function splitName(name: string): [string, string] {
    const at = name.lastIndexOf(' ');

    return at === -1 ? [name, ''] : [name.slice(0, at), name.slice(at + 1)];
}

export function Wordmark({ size = 'md' }: { size?: 'md' | 'lg' }) {
    const [first, last] = splitName(brand.name);

    return (
        <span
            className={cn(
                'flex flex-col text-left leading-[1.1] font-bold tracking-tight',
                size === 'lg' ? 'text-lg' : 'text-base sm:text-lg',
            )}
        >
            <span className="text-white">{first}</span>
            {last && <span className="text-brand-lime">{last}</span>}
        </span>
    );
}

/**
 * The public site's top bar. On the home page it scrolls to sections in place
 * (onNavigate); on the other public pages (FAQ, legal) its links lead home.
 */
export function SiteHeader({ onNavigate }: { onNavigate?: (key: 'home' | 'book') => void }) {
    const { auth } = usePage().props;
    const accountHref = auth.user?.isVenueAdmin ? dashboard() : bookingsIndex();

    const outlineClass =
        'h-10 rounded-lg border-white/70 bg-transparent px-4 text-white shadow-none hover:bg-white/10 hover:text-white';
    const bookClass = 'h-10 rounded-lg bg-brand-lime px-4 font-bold text-brand-navy hover:bg-brand-lime-dark';

    const logo = (
        <>
            {/* Named: on phones the wordmark is hidden and this is the link's only content. */}
            <img src={brand.logo} alt={brand.name} className="size-10 shrink-0 object-contain sm:size-12" />
            <span className="hidden sm:block">
                <Wordmark />
            </span>
        </>
    );

    const bookLabel = (
        <>
            <CalendarDays className="size-4" />
            <span className="hidden sm:inline">Book a Court</span>
            <span className="sm:hidden">Book</span>
        </>
    );

    return (
        <header className="sticky top-0 z-40 border-b border-white/10 bg-brand-navy-dark/95 text-white backdrop-blur-md print:hidden">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:h-18 sm:px-6 lg:px-8">
                {onNavigate ? (
                    <button type="button" onClick={() => onNavigate('home')} className="flex min-w-0 items-center gap-3">
                        {logo}
                    </button>
                ) : (
                    <Link href={home()} className="flex min-w-0 items-center gap-3">
                        {logo}
                    </Link>
                )}

                <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                    <InstallAppButton variant="outline" iconOnly className={cn(outlineClass, 'px-2.5 sm:hidden')} />
                    <InstallAppButton variant="outline" className={cn(outlineClass, 'hidden sm:inline-flex')} />
                    <Button variant="outline" asChild className={outlineClass}>
                        <Link href={auth.user ? accountHref : login()}>
                            <UserRound className="size-4" />
                            <span className="hidden sm:inline">{auth.user ? 'My account' : 'Login'}</span>
                        </Link>
                    </Button>
                    {onNavigate ? (
                        <Button onClick={() => onNavigate('book')} className={bookClass}>
                            {bookLabel}
                        </Button>
                    ) : (
                        <Button asChild className={bookClass}>
                            <Link href={`${home().url}#explore`}>{bookLabel}</Link>
                        </Button>
                    )}
                </div>
            </div>
        </header>
    );
}
