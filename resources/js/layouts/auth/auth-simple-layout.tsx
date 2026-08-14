import { Link } from '@inertiajs/react';
<<<<<<< HEAD
import { CalendarCheck2, ShieldCheck, Users } from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';
import { brand } from '@/lib/brand';
=======
<<<<<<< Updated upstream
import { BrandLogo } from '@/components/brand-logo';
=======
import { CalendarCheck2, ShieldCheck, Users } from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';
import { brand } from '@/lib/brand';
>>>>>>> Stashed changes
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

const highlights = [
    {
        icon: CalendarCheck2,
        title: 'Book courts in seconds',
        description: 'Real-time availability for every pickleball court on-site.',
    },
    {
        icon: Users,
        title: 'Manage your sessions',
        description: 'Track bookings, open play, and rentals from one place.',
    },
    {
        icon: ShieldCheck,
        title: 'Secure member access',
        description: 'Your account and payments are protected end-to-end.',
    },
];

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
<<<<<<< HEAD
        <div className="relative flex min-h-svh flex-col bg-slate-50 lg:grid lg:grid-cols-2 dark:bg-brand-navy-dark">
            <section className="relative hidden flex-col overflow-hidden bg-brand-navy p-10 text-white lg:flex xl:p-14">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-navy via-brand-navy-light to-brand-court/80" />
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -top-24 -right-24 size-80 rounded-full bg-brand-lime/10 blur-3xl" />
                    <div className="absolute -bottom-24 -left-16 size-64 rounded-full bg-brand-court/20 blur-3xl" />
=======
<<<<<<< Updated upstream
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted/40 p-6 md:p-10">
            <div className="w-full max-w-sm">
                <div className="flex flex-col items-center gap-2 pb-8">
                    <Link
                        href={home()}
                        className="flex flex-col items-center gap-3 font-medium"
                    >
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl border bg-card p-2 shadow-sm">
                            <BrandLogo imageClassName="size-full" />
                        </div>
                        <span className="sr-only">{title}</span>
                    </Link>
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
                </div>

                <div className="relative z-10 flex flex-1 flex-col justify-center">
                    <div className="max-w-md">
                        <Link href={home()} className="flex justify-center">
                            <img
                                src={brand.logo}
                                alt={brand.name}
                                className="size-40 object-contain drop-shadow-2xl xl:size-48"
                            />
                        </Link>

                        <p className="mt-6 text-center text-sm font-semibold tracking-wide text-brand-lime uppercase">
                            {brand.tagline}
                        </p>
<<<<<<< HEAD
                        <h2 className="mt-2 text-center text-3xl font-extrabold tracking-tight xl:text-4xl">
                            {brand.name}
                        </h2>
                        <p className="mt-4 text-center text-white/70">
                            Sign in to reserve courts, join open play, and
                            manage your bookings.
                        </p>

                        <div className="mt-10 space-y-5">
                            {highlights.map(({ icon: Icon, title, description }) => (
                                <div key={title} className="flex items-start gap-3">
                                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-lime/15">
                                        <Icon className="size-4 text-brand-lime" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-white">
                                            {title}
                                        </p>
                                        <p className="text-sm text-white/60">
                                            {description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

=======
=======
        <div className="relative flex min-h-svh flex-col bg-slate-50 lg:grid lg:grid-cols-2 dark:bg-brand-navy-dark">
            <section className="relative hidden flex-col overflow-hidden bg-brand-navy p-10 text-white lg:flex xl:p-14">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-navy via-brand-navy-light to-brand-court/80" />
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -top-24 -right-24 size-80 rounded-full bg-brand-lime/10 blur-3xl" />
                    <div className="absolute -bottom-24 -left-16 size-64 rounded-full bg-brand-court/20 blur-3xl" />
                </div>

                <div className="relative z-10 flex flex-1 flex-col justify-center">
                    <div className="max-w-md">
                        <Link href={home()} className="flex justify-center">
                            <img
                                src={brand.logo}
                                alt={brand.name}
                                className="size-40 object-contain drop-shadow-2xl xl:size-48"
                            />
                        </Link>

                        <p className="mt-6 text-center text-sm font-semibold tracking-wide text-brand-lime uppercase">
                            {brand.tagline}
                        </p>
                        <h2 className="mt-2 text-center text-3xl font-extrabold tracking-tight xl:text-4xl">
                            {brand.name}
                        </h2>
                        <p className="mt-4 text-center text-white/70">
                            Sign in to reserve courts, join open play, and
                            manage your bookings.
                        </p>

                        <div className="mt-10 space-y-5">
                            {highlights.map(({ icon: Icon, title, description }) => (
                                <div key={title} className="flex items-start gap-3">
                                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-lime/15">
                                        <Icon className="size-4 text-brand-lime" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-white">
                                            {title}
                                        </p>
                                        <p className="text-sm text-white/60">
                                            {description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
                <p className="relative z-10 text-center text-xs text-white/40">
                    &copy; {new Date().getFullYear()} {brand.name}. All
                    rights reserved.
                </p>
            </section>

            <section className="flex flex-1 flex-col items-center justify-center gap-6 p-6 md:p-10">
                <div className="w-full max-w-sm">
                    <div className="flex flex-col gap-8">
                        <div className="flex flex-col items-center gap-4 lg:hidden">
                            <Link href={home()}>
                                <BrandLogo imageClassName="size-14" />
                            </Link>
                        </div>

                        <div className="space-y-2 text-center lg:text-left">
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                {title}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {description}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm sm:p-8">
                            {children}
                        </div>
<<<<<<< HEAD
=======
>>>>>>> Stashed changes
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
                    </div>
                </div>
            </section>
        </div>
    );
}
