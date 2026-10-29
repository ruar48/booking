import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Calendar, CalendarClock, CalendarDays, Dumbbell, Home, LayoutGrid, LogIn, Receipt, UserPlus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { PaddleRally } from '@/components/paddle-rally';
import { Button } from '@/components/ui/button';
import { useIsVenueAdmin } from '@/hooks/use-is-venue-admin';
import { brand } from '@/lib/brand';
import { dashboard, home, login, register } from '@/routes';
import { calendar as bookingsCalendar, create as createBooking, index as bookingsIndex } from '@/routes/bookings';
import { browse as openPlayBrowse } from '@/routes/open-play';
import { checkout as posCheckout } from '@/routes/pos';
import { browse as rentalsBrowse } from '@/routes/rentals';

const REDIRECT_SECONDS = 10;

type Destination = { label: string; href: string; icon: LucideIcon };

/**
 * Where a lost visitor most likely meant to go, by who they are: staff land
 * on the dashboard, players on their bookings, guests on the home page.
 */
function useDestinations(): { primary: Destination; links: Destination[] } {
    const { auth } = usePage().props;
    const isVenueAdmin = useIsVenueAdmin();

    if (isVenueAdmin) {
        return {
            primary: { label: 'Dashboard', href: dashboard().url, icon: LayoutGrid },
            links: [
                { label: 'Bookings', href: bookingsIndex().url, icon: Calendar },
                { label: 'Calendar', href: bookingsCalendar().url, icon: CalendarDays },
                { label: 'POS', href: posCheckout().url, icon: Receipt },
            ],
        };
    }

    if (auth.user) {
        return {
            primary: { label: 'My bookings', href: bookingsIndex().url, icon: Calendar },
            links: [
                { label: 'Book a court', href: createBooking().url, icon: CalendarDays },
                { label: 'Open play', href: openPlayBrowse().url, icon: CalendarClock },
                { label: 'Rentals', href: rentalsBrowse().url, icon: Dumbbell },
            ],
        };
    }

    return {
        primary: { label: 'Home', href: home().url, icon: Home },
        links: [
            { label: 'Log in', href: login().url, icon: LogIn },
            { label: 'Sign up', href: register().url, icon: UserPlus },
        ],
    };
}

export default function NotFound() {
    const { primary, links } = useDestinations();
    const [secondsLeft, setSecondsLeft] = useState<number | null>(REDIRECT_SECONDS);

    useEffect(() => {
        if (secondsLeft === null) {
            return;
        }

        if (secondsLeft <= 0) {
            router.visit(primary.href);

            return;
        }

        const timeout = window.setTimeout(() => setSecondsLeft((s) => (s === null ? null : s - 1)), 1000);

        return () => window.clearTimeout(timeout);
    }, [secondsLeft, primary.href]);

    const goBack = () => {
        setSecondsLeft(null);

        if (window.history.length > 1) {
            window.history.back();
        } else {
            router.visit(primary.href);
        }
    };

    return (
        <>
            <Head title="Page not found" />
            <main className="from-brand-navy flex min-h-svh items-center justify-center bg-gradient-to-br to-slate-900 px-4 py-12 text-white">
                <div className="w-full max-w-md text-center">
                    <img src={brand.logo} alt={brand.name} className="mx-auto mb-2 size-16 rounded-full bg-white/10 p-1" />

                    <PaddleRally className="mx-auto max-w-xs" label="A paddle driving the ball out of bounds" />

                    <p className="text-brand-lime -mt-2 text-7xl font-extrabold tracking-tight sm:text-8xl">404</p>
                    <h1 className="mt-3 text-2xl font-bold sm:text-3xl">That shot went out of bounds</h1>
                    <p className="mt-2 text-sm text-white/70">
                        The page you&apos;re looking for doesn&apos;t exist or has moved. Let&apos;s get you back on
                        the court.
                    </p>

                    <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
                        <Button
                            asChild
                            size="lg"
                            className="bg-brand-lime text-brand-navy hover:bg-brand-lime-dark font-bold"
                        >
                            <Link href={primary.href}>
                                <primary.icon className="size-4" />
                                Go to {primary.label}
                            </Link>
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            onClick={goBack}
                            className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
                        >
                            <ArrowLeft className="size-4" />
                            Go back
                        </Button>
                    </div>

                    {secondsLeft !== null ? (
                        <p className="mt-4 text-xs text-white/60">
                            Taking you to {primary.label} in {secondsLeft}s…{' '}
                            <button
                                type="button"
                                onClick={() => setSecondsLeft(null)}
                                className="underline underline-offset-2 hover:text-white"
                            >
                                Stay here
                            </button>
                        </p>
                    ) : null}

                    <div className="mt-10 border-t border-white/10 pt-6">
                        <p className="mb-3 text-xs font-medium tracking-wide text-white/50 uppercase">
                            Or jump to
                        </p>
                        <div className="flex flex-wrap justify-center gap-2">
                            {links.map((link) => (
                                <Link
                                    key={link.label}
                                    href={link.href}
                                    className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm transition hover:bg-white/20"
                                >
                                    <link.icon className="size-3.5" />
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
