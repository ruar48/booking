import { Head, Link, usePage } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import {
    ArrowRight,
    Armchair,
    CalendarDays,
    CircleCheck,
    Clock,
    CupSoda,
    Facebook,
    GraduationCap,
    Grid3x3,
    Heart,
    ImageIcon,
    Instagram,
    LandPlot,
    Lightbulb,
    Mail,
    MapPin,
    Megaphone,
    Navigation,
    Package,
    Phone,
    ShowerHead,
    SquareParking,
    Toilet,
    UserRound,
    Users,
    UsersRound,
    Wifi,
    Youtube,
} from 'lucide-react';
import type { LucideIcon, LucideProps } from 'lucide-react';
import { useState } from 'react';
import type { ComponentType } from 'react';

import { BookYourCourt, PanelTitle, useCourtBooking } from '@/components/home-court-booking';
import { InstallAppButton } from '@/components/install-app-button';
import { PaddleDuel } from '@/components/paddle-duel';
import { PhotoLightbox } from '@/components/photo-lightbox';
import { SupportWidget } from '@/components/support-widget';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { venueAddress, venueMapUrls } from '@/components/venue-map';
import { brand } from '@/lib/brand';
import { formatClock, formatCurrency, formatDate, formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { dashboard, login, register } from '@/routes';
import { index as bookingsIndex } from '@/routes/bookings';
import {
    browse as openPlayBrowse,
    show as openPlayShow,
} from '@/routes/open-play';
import type {
    Announcement,
    BookedSlot,
    DateOverride,
    GallerySection,
    HourForecast,
    OpenPlaySession,
    PublicCoach,
    Resource,
    VenueProfile,
} from '@/types/booking';

type HomeStats = {
    courts: number;
    members: number;
    bookings_today: number;
    available_slots_today: number;
    open_play_this_week: number;
};

type Props = {
    venue?: VenueProfile | null;
    courts: Resource[];
    stats: HomeStats;
    announcements?: Announcement[];
    openPlaySessions?: OpenPlaySession[];
    bookedSlots?: BookedSlot[];
    dateOverrides?: DateOverride[];
    hourlyWeather?: Record<string, HourForecast>;
    gallery?: GallerySection[];
    coaches?: PublicCoach[];
};

type ExploreTab = 'book' | 'open-play' | 'coaches' | 'photos';

type NavKey = 'home' | ExploreTab;

const heroImage = '/bg.webp';

const fallbackDescription =
    'A place where you can enjoy playing pickleball with your friends, family, and fellow players. Whether you are a beginner or an experienced player, everyone is welcome to play, have fun, stay active, and enjoy the game together.';


/** "Galaang-Ramos Pickleball" → ["Galaang-Ramos", "Pickleball"], for the two-tone wordmark. */
function splitName(name: string): [string, string] {
    const at = name.lastIndexOf(' ');

    return at === -1 ? [name, ''] : [name.slice(0, at), name.slice(at + 1)];
}

function formatSkillLevel(level?: string): string {
    if (!level || level === 'all_levels') {
        return 'All levels';
    }

    return level
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

const courtGradients = [
    'from-brand-court to-brand-navy',
    'from-brand-lime to-brand-court',
];

// Lucide has no running figure, so this is drawn in its 24px / 2px-stroke
// style to sit alongside the stock icons.
function RunnerIcon({ className, ...props }: LucideProps) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
            {...props}
        >
            <circle cx="15.5" cy="4" r="2" />
            <path d="M13.5 8 11 13.5" />
            <path d="m11 13.5-3 2-2.5 4.5" />
            <path d="m11 13.5 3 2.5-1 5" />
            <path d="m5 10.5 3.5-2.5h5l2 3 3.5 1" />
        </svg>
    );
}

const exploreTabs: { key: ExploreTab; label: string; icon: ComponentType<LucideProps> }[] = [
    { key: 'book', label: 'Book a Court', icon: CalendarDays },
    { key: 'open-play', label: 'Open Play', icon: RunnerIcon },
    { key: 'coaches', label: 'Coaches', icon: GraduationCap },
    { key: 'photos', label: 'Photos', icon: ImageIcon },
];

/** Lime brush stroke under the script taglines. */
function Swoosh({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 200 20"
            fill="none"
            className={className}
            aria-hidden="true"
        >
            <path
                d="M4 15C50 6 120 3 196 6"
                stroke="currentColor"
                strokeWidth="5"
                strokeLinecap="round"
            />
        </svg>
    );
}

function Wordmark({ size = 'md' }: { size?: 'md' | 'lg' }) {
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

function amenityIcon(name: string): LucideIcon {
    const n = name.toLowerCase();

    if (/rest ?room|toilet|comfort|\bcr\b/.test(n)) {
        return Toilet;
    }

    if (/shower/.test(n)) {
        return ShowerHead;
    }

    if (/park/.test(n)) {
        return SquareParking;
    }

    if (/snack|refresh|food|drink|cafe|coffee|canteen/.test(n)) {
        return CupSoda;
    }

    if (/rent|equipment|paddle/.test(n)) {
        return Package;
    }

    if (/wi-?fi|internet/.test(n)) {
        return Wifi;
    }

    if (/light/.test(n)) {
        return Lightbulb;
    }

    if (/seat|bench|lounge|waiting/.test(n)) {
        return Armchair;
    }

    return CircleCheck;
}

function SiteHeader({ onNavigate }: { onNavigate: (key: NavKey) => void }) {
    const { auth } = usePage().props;
    const accountHref = auth.user?.isVenueAdmin ? dashboard() : bookingsIndex();

    const outlineClass =
        'h-10 rounded-lg border-white/70 bg-transparent px-4 text-white shadow-none hover:bg-white/10 hover:text-white';

    return (
        <header className="sticky top-0 z-40 border-b border-white/10 bg-brand-navy-dark/95 text-white backdrop-blur-md">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:h-[4.5rem] sm:px-6 lg:px-8">
                <button
                    type="button"
                    onClick={() => onNavigate('home')}
                    className="flex min-w-0 items-center gap-3"
                >
                    <img
                        src={brand.logo}
                        alt=""
                        className="size-10 shrink-0 object-contain sm:size-12"
                    />
                    <span className="hidden sm:block">
                        <Wordmark />
                    </span>
                </button>

                <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                    <InstallAppButton
                        variant="outline"
                        iconOnly
                        className={cn(outlineClass, 'px-2.5 sm:hidden')}
                    />
                    <InstallAppButton
                        variant="outline"
                        className={cn(outlineClass, 'hidden sm:inline-flex')}
                    />
                    <Button variant="outline" asChild className={outlineClass}>
                        <Link href={auth.user ? accountHref : login()}>
                            <UserRound className="size-4" />
                            <span className="hidden sm:inline">
                                {auth.user ? 'My account' : 'Login'}
                            </span>
                        </Link>
                    </Button>
                    <Button
                        onClick={() => onNavigate('book')}
                        className="h-10 rounded-lg bg-brand-lime px-4 font-bold text-brand-navy hover:bg-brand-lime-dark"
                    >
                        <CalendarDays className="size-4" />
                        <span className="hidden sm:inline">Book a Court</span>
                        <span className="sm:hidden">Book</span>
                    </Button>
                </div>
            </div>
        </header>
    );
}

function Hero({
    venue,
    onBook,
    onOpenPlay,
}: {
    venue?: VenueProfile | null;
    onBook: () => void;
    onOpenPlay: () => void;
}) {
    const [first, last] = splitName(brand.name);
    // The hero only has room for the opening paragraph; the About section has the rest.
    const intro = (venue?.description ?? fallbackDescription).split('\n').find(Boolean);

    return (
        <section className="relative overflow-hidden bg-brand-navy-dark text-white">
            <img
                src={heroImage}
                alt=""
                className="absolute inset-0 size-full object-cover object-[70%_center]"
                fetchPriority="high"
            />
            {/* Darken the left for the headline; let the paddle show through on the right. */}
            <div className="absolute inset-0 bg-gradient-to-r from-brand-navy-dark/95 via-brand-navy-dark/70 to-brand-navy-dark/5" />
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-brand-navy-dark/60 to-transparent" />

            <div className="pointer-events-none absolute top-8 right-6 hidden flex-col items-end md:flex lg:right-10">
                <img
                    src={brand.logo}
                    alt=""
                    className="size-36 object-contain drop-shadow-[0_16px_32px_rgba(0,0,0,0.55)] lg:size-44"
                />
                <div
                    className="mt-3 mr-2 -rotate-12 text-right font-script text-2xl leading-tight text-brand-lime drop-shadow-lg lg:text-3xl"
                    aria-hidden="true"
                >
                    <p className="mr-8">Play Hard</p>
                    <p>Stay Connected</p>
                </div>
            </div>

            {/*
              * Right half of the hero, just above the stats card that overlaps the
              * hero's bottom edge (-mt-16). A soft navy wash keeps the rally readable
              * over the busy photo without boxing it in. xl+ only: below that it
              * would run into the headline's buttons.
              */}
            <div className="pointer-events-none absolute right-4 bottom-[4.5rem] hidden w-[48vw] max-w-[900px] bg-[radial-gradient(ellipse_at_center,rgba(10,28,48,0.8)_0%,rgba(10,28,48,0.55)_45%,transparent_72%)] text-white xl:block">
                <PaddleDuel />
            </div>

            <div className="relative mx-auto max-w-7xl px-4 pt-10 pb-28 sm:px-6 sm:pt-14 lg:px-8 lg:pt-16 lg:pb-32">
                <div className="max-w-xl">
                    <span className="inline-flex items-center rounded-full bg-brand-lime px-3.5 py-1 text-xs font-bold text-brand-navy sm:text-sm">
                        Play • Connect • Belong
                    </span>
                    <h1 className="mt-5 text-4xl leading-[1.05] font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                        Welcome to
                        <span className="block text-brand-lime">{first}</span>
                        {last && <span className="block text-brand-lime">{last}</span>}
                    </h1>
                    <p className="mt-5 line-clamp-4 text-sm leading-relaxed text-white/85 sm:text-base">
                        {intro}
                    </p>
                    <div className="mt-8 flex flex-wrap gap-3 sm:gap-4">
                        <Button
                            size="lg"
                            onClick={onBook}
                            className="h-12 rounded-xl bg-brand-lime px-6 font-bold text-brand-navy hover:bg-brand-lime-dark"
                        >
                            <CalendarDays className="size-4" />
                            Book a Court
                            <ArrowRight className="size-4" />
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            onClick={onOpenPlay}
                            className="h-12 rounded-xl border-white/70 bg-brand-navy-dark/30 px-6 font-semibold text-white shadow-none hover:bg-white/10 hover:text-white"
                        >
                            <UsersRound className="size-4" />
                            Explore Open Play
                        </Button>
                    </div>

                    {/* Below xl there's no room beside the headline, so the rally sits under the buttons. */}
                    <div className="pointer-events-none mt-6 bg-[radial-gradient(ellipse_at_center,rgba(10,28,48,0.7)_0%,rgba(10,28,48,0.4)_45%,transparent_72%)] text-white xl:hidden">
                        <PaddleDuel bigCheers />
                    </div>
                </div>
            </div>
        </section>
    );
}

function StatsBar({ items }: { items: { label: string; value: string | number; icon: LucideIcon }[] }) {
    return (
        <div className="relative z-10 mx-auto -mt-16 max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-3 rounded-2xl border border-white/10 bg-brand-navy px-2 py-5 text-white shadow-xl sm:p-6">
                {items.map(({ label, value, icon: Icon }, index) => (
                    <div
                        key={label}
                        className={cn(
                            'flex flex-col items-center gap-2 px-1 text-center sm:flex-row sm:justify-center sm:gap-4 sm:text-left',
                            index > 0 && 'border-l border-white/15',
                        )}
                    >
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-full ring-2 ring-brand-lime/80 sm:size-14">
                            <Icon className="size-5 text-brand-lime sm:size-7" />
                        </span>
                        <div className="min-w-0">
                            <p className="text-xl leading-none font-bold sm:text-3xl">
                                {value}
                            </p>
                            <p className="mt-1 text-[11px] leading-tight text-white/80 sm:text-sm">
                                {label}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

const panelClass =
    'rounded-2xl border border-slate-200 bg-white shadow-sm';

function PanelHeading({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
    return (
        <h2 className="flex items-center gap-2.5 text-base font-bold text-brand-navy">
            <Icon className="size-5 shrink-0" />
            {children}
        </h2>
    );
}

/** Today's hours, or the next date an admin has opened if today is closed. */
function operatingHours(dateOverrides: DateOverride[]): string {
    const today = format(new Date(), 'yyyy-MM-dd');
    const next = dateOverrides
        .filter((o) => !o.is_closed && o.open_time && o.close_time && o.date.slice(0, 10) >= today)
        .sort((a, b) => a.date.localeCompare(b.date))[0];

    if (!next) {
        return 'Schedule coming soon';
    }

    const day = next.date.slice(0, 10);
    const hours = `${formatClock(next.open_time!.slice(0, 5))} – ${formatClock(next.close_time!.slice(0, 5))}`;

    return day === today
        ? `Open today · ${hours}`
        : `Closed today · opens ${format(parseISO(`${day}T12:00:00`), 'EEE, MMM d')}, ${hours}`;
}

function LocationCard({
    venue,
    dateOverrides,
}: {
    venue?: VenueProfile | null;
    dateOverrides: DateOverride[];
}) {
    const urls = venue ? venueMapUrls(venue) : null;
    const details = [
        { icon: MapPin, label: urls?.address ?? 'Address coming soon', href: null },
        { icon: Clock, label: operatingHours(dateOverrides), href: null },
        venue?.phone && {
            icon: Phone,
            label: venue.phone,
            href: `tel:${venue.phone.replace(/[^\d+]/g, '')}`,
        },
        venue?.email && { icon: Mail, label: venue.email, href: `mailto:${venue.email}` },
    ].filter(Boolean) as { icon: LucideIcon; label: string; href: string | null }[];

    return (
        <div className={cn(panelClass, 'overflow-hidden')}>
            <div className="relative overflow-hidden bg-brand-navy-dark text-white">
                <img
                    src={heroImage}
                    alt=""
                    className="absolute inset-0 size-full object-cover object-[60%_30%] opacity-35"
                    loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-brand-navy-dark/90 to-brand-navy-dark/60" />
                <div className="relative p-4">
                    <h2 className="flex items-center gap-2 text-sm font-bold">
                        <MapPin className="size-4 text-brand-lime" />
                        Our Club Location
                    </h2>
                    <ul className="mt-3 space-y-2 text-xs text-white/85">
                        {details.map(({ icon: Icon, label, href }) => (
                            <li key={label} className="flex items-start gap-2.5">
                                <Icon className="mt-px size-3.5 shrink-0 text-brand-lime" />
                                {href ? (
                                    <a href={href} className="min-w-0 truncate hover:text-brand-lime">
                                        {label}
                                    </a>
                                ) : (
                                    <span className="min-w-0">{label}</span>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {urls && (
                <div className="space-y-3 p-3">
                    <iframe
                        title={`Map of ${urls.address}`}
                        src={urls.embedUrl}
                        className="h-36 w-full rounded-xl border-0 bg-slate-100"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        allowFullScreen
                    />
                    <Button
                        asChild
                        className="h-11 w-full rounded-xl bg-brand-lime font-bold text-brand-navy hover:bg-brand-lime-dark"
                    >
                        <a href={urls.directionsUrl} target="_blank" rel="noopener noreferrer">
                            <Navigation className="size-4" />
                            Get Directions
                            <ArrowRight className="size-4" />
                        </a>
                    </Button>
                </div>
            )}
        </div>
    );
}

function NewsCard({ announcements }: { announcements: Announcement[] }) {
    const [openId, setOpenId] = useState<Announcement['id'] | null>(null);

    return (
        <div className={cn(panelClass, 'p-5')}>
            <PanelHeading icon={Megaphone}>News &amp; Announcements</PanelHeading>

            {announcements.length === 0 ? (
                <p className="mt-3 text-xs text-slate-500">
                    No announcements right now. Check back soon.
                </p>
            ) : (
                <ul className="mt-2">
                    {announcements.slice(0, 3).map((announcement) => {
                        const isOpen = openId === announcement.id;

                        return (
                            <li key={announcement.id} className="border-b border-slate-100 last:border-0">
                                <button
                                    type="button"
                                    onClick={() => setOpenId(isOpen ? null : announcement.id)}
                                    aria-expanded={isOpen}
                                    className="flex w-full items-start gap-3 py-3 text-left"
                                >
                                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-emerald-500" />
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-xs font-bold text-brand-navy">
                                            {announcement.title}
                                        </span>
                                        <span
                                            className={cn(
                                                'mt-0.5 block text-xs leading-relaxed text-slate-500',
                                                !isOpen && 'line-clamp-1',
                                            )}
                                        >
                                            {announcement.content}
                                        </span>
                                        {announcement.published_at && (
                                            <span className="mt-1 block text-[11px] text-slate-400">
                                                {formatDate(announcement.published_at)}
                                            </span>
                                        )}
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}

function PromoCard({ onClick }: { onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="group relative block h-48 w-full overflow-hidden rounded-2xl bg-brand-navy-dark text-left shadow-sm"
            aria-label="Explore Open Play"
        >
            {/* The ball-and-paddle corner of the hero photo. */}
            <div
                className="absolute inset-0 bg-cover transition-transform duration-500 group-hover:scale-105"
                style={{ backgroundImage: `url(${heroImage})`, backgroundPosition: '78% 75%', backgroundSize: '260%' }}
                aria-hidden="true"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-brand-navy-dark/90 via-brand-navy-dark/50 to-transparent" />
            <div className="absolute right-4 bottom-5 -rotate-6 text-right font-script text-2xl leading-tight text-white drop-shadow-lg">
                <p className="mr-6">More Plays</p>
                <p className="mr-3">More Friends</p>
                <p>
                    More <span className="text-brand-lime">Pickleball</span>
                </p>
                <Swoosh className="-mt-1 ml-auto w-32 text-brand-lime" />
            </div>
        </button>
    );
}

const slotRange = (slots: { start: string; end: string }[]) =>
    slots.map((slot) => `${formatClock(slot.start)} – ${formatClock(slot.end)}`).join(', ');

function CoachAvailability({ coach }: { coach: PublicCoach }) {
    if (coach.today_slots.length > 0) {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-lime px-2.5 py-1 text-xs font-bold text-brand-navy">
                <span className="size-1.5 rounded-full bg-emerald-600" />
                Available today · {slotRange(coach.today_slots)}
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white">
            <Clock className="size-3.5" />
            {coach.next_available_day ? `Next available: ${coach.next_available_day}` : 'By appointment'}
        </span>
    );
}

function CoachCard({ coach }: { coach: PublicCoach }) {
    const initials = coach.name
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('');
    const workingDays = coach.schedule.filter((day) => day.slots.length > 0);

    return (
        <article className={cn(panelClass, 'flex flex-col overflow-hidden')}>
            <div className="relative bg-gradient-to-br from-brand-navy to-brand-navy-light p-5 text-white">
                <div
                    className="pointer-events-none absolute inset-y-0 -right-6 w-24 -skew-x-[20deg] bg-brand-lime/15"
                    aria-hidden="true"
                />
                <div className="relative flex items-center gap-4">
                    {coach.photo_url ? (
                        <img
                            src={coach.photo_url}
                            alt={coach.name}
                            className="size-20 shrink-0 rounded-full object-cover ring-4 ring-brand-lime/70"
                            loading="lazy"
                        />
                    ) : (
                        <span className="flex size-20 shrink-0 items-center justify-center rounded-full bg-white/10 text-2xl font-bold text-brand-lime ring-4 ring-brand-lime/70">
                            {initials}
                        </span>
                    )}
                    <div className="min-w-0 space-y-1.5">
                        <h3 className="truncate text-lg font-bold">{coach.name}</h3>
                        <p className="text-xs text-white/75">
                            {coach.years_experience > 0
                                ? `${coach.years_experience} ${coach.years_experience === 1 ? 'year' : 'years'} coaching`
                                : 'Pickleball coach'}
                        </p>
                        <CoachAvailability coach={coach} />
                    </div>
                </div>
            </div>

            <div className="flex flex-1 flex-col gap-4 p-5">
                {coach.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {coach.specialties.map((specialty) => (
                            <span
                                key={specialty}
                                className="rounded-full bg-lime-50 px-2.5 py-1 text-xs font-medium text-brand-navy ring-1 ring-lime-200"
                            >
                                {specialty}
                            </span>
                        ))}
                    </div>
                )}

                {coach.bio && (
                    <p className="line-clamp-3 text-sm leading-relaxed text-brand-navy-light">
                        {coach.bio}
                    </p>
                )}

                {coach.certifications.length > 0 && (
                    <p className="flex items-start gap-2 text-xs text-brand-navy-light">
                        <CircleCheck className="mt-px size-3.5 shrink-0 text-emerald-600" />
                        {coach.certifications.join(' · ')}
                    </p>
                )}

                <div>
                    <div className="grid grid-cols-7 gap-1" aria-hidden="true">
                        {coach.schedule.map((day) => (
                            <span
                                key={day.day}
                                className={cn(
                                    'rounded-md py-1 text-center text-[0.65rem] font-semibold',
                                    day.slots.length > 0
                                        ? 'bg-brand-navy text-brand-lime'
                                        : 'bg-slate-100 text-slate-400',
                                )}
                            >
                                {day.label}
                            </span>
                        ))}
                    </div>
                    {workingDays.length > 0 ? (
                        <ul className="mt-2 space-y-0.5 text-xs text-brand-navy-light">
                            {workingDays.map((day) => (
                                <li key={day.day}>
                                    <span className="inline-block w-9 font-semibold text-brand-navy">
                                        {day.label}
                                    </span>
                                    {slotRange(day.slots)}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="mt-2 text-xs text-slate-500">
                            Schedule on request — ask at the front desk.
                        </p>
                    )}
                </div>

                <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <p className="text-sm text-brand-navy-light">
                        {coach.rate_per_hour != null ? (
                            <>
                                <span className="text-lg font-bold text-brand-navy">
                                    {formatCurrency(coach.rate_per_hour)}
                                </span>{' '}
                                / hour
                            </>
                        ) : (
                            'Rate on request'
                        )}
                    </p>
                    {coach.phone && (
                        <Button
                            asChild
                            size="sm"
                            className="bg-brand-lime font-bold text-brand-navy hover:bg-brand-lime-dark"
                        >
                            <a href={`tel:${coach.phone.replace(/[^\d+]/g, '')}`}>
                                <Phone className="size-4" />
                                Call coach
                            </a>
                        </Button>
                    )}
                </div>
            </div>
        </article>
    );
}

function CoachesTab({ coaches }: { coaches: PublicCoach[] }) {
    if (coaches.length === 0) {
        return (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 px-4 py-12 text-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-brand-lime/25">
                    <GraduationCap className="size-6 text-emerald-700" />
                </span>
                <p className="text-sm font-semibold text-brand-navy">Coaches coming soon</p>
                <p className="max-w-sm text-xs text-slate-500">
                    We&apos;re lining up coaches for private and group lessons. Ask at the front desk in the meantime.
                </p>
            </div>
        );
    }

    return (
        <div className="grid gap-5 md:grid-cols-2">
            {coaches.map((coach) => (
                <CoachCard key={coach.id} coach={coach} />
            ))}
        </div>
    );
}

function OpenPlayTab({
    sessions,
    isAuthenticated,
}: {
    sessions: OpenPlaySession[];
    isAuthenticated: boolean;
}) {
    const grouped = sessions.reduce<Record<string, OpenPlaySession[]>>(
        (acc, session) => {
            const day = session.starts_at.split('T')[0];
            acc[day] = acc[day] ?? [];
            acc[day].push(session);

            return acc;
        },
        {},
    );

    const days = Object.keys(grouped).sort();

    if (!days.length) {
        return (
            <Card className="border-slate-200 shadow-sm">
                <CardContent className="py-12 text-center text-sm text-slate-500">
                    No open play sessions scheduled yet. Check back soon.
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {days.map((day) => (
                <div key={day}>
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <CalendarDays className="size-4 text-brand-court" />
                        {format(parseISO(`${day}T12:00:00`), 'EEEE, MMMM d')}
                    </div>
                    <div className="space-y-3">
                        {grouped[day].map((session) => (
                            <Card
                                key={session.id}
                                className="border-slate-200 shadow-sm"
                            >
                                <CardContent className="pt-6">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="space-y-3">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="font-bold text-slate-800">
                                                    {session.title}
                                                </h3>
                                                <Badge variant="secondary">
                                                    {formatSkillLevel(
                                                        session.skill_level,
                                                    )}
                                                </Badge>
                                            </div>
                                            <ul className="space-y-1.5 text-sm text-slate-600">
                                                <li className="flex items-center gap-2">
                                                    <Clock className="size-4 text-brand-court" />
                                                    {formatTime(
                                                        session.starts_at,
                                                    )}
                                                    {session.ends_at &&
                                                        ` – ${formatTime(session.ends_at)}`}
                                                </li>
                                                {session.location && (
                                                    <li className="flex items-center gap-2">
                                                        <MapPin className="size-4 text-brand-court" />
                                                        {session.location}
                                                    </li>
                                                )}
                                                <li className="flex items-center gap-2">
                                                    <Users className="size-4 text-brand-court" />
                                                    {session.max_players
                                                        ? `${session.registrations_count ?? 0}/${session.max_players} players`
                                                        : `${session.registrations_count ?? 0} players joined`}
                                                </li>
                                                {session.registration_closes_at &&
                                                    !session.is_registration_closed && (
                                                        <li className="flex items-center gap-2 text-amber-700">
                                                            <Clock className="size-4" />
                                                            Registration closes{' '}
                                                            {formatTime(
                                                                session.registration_closes_at,
                                                            )}
                                                        </li>
                                                    )}
                                            </ul>
                                        </div>
                                        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                                            {session.price_per_player !=
                                                null && (
                                                <p className="text-sm font-semibold text-slate-700">
                                                    {formatCurrency(
                                                        session.price_per_player,
                                                    )}{' '}
                                                    <span className="font-normal text-slate-500">
                                                        per player
                                                    </span>
                                                </p>
                                            )}
                                            {session.is_registration_closed ? (
                                                <Button disabled>
                                                    Registration closed
                                                </Button>
                                            ) : (
                                                <Button
                                                    asChild
                                                    className="bg-brand-lime font-semibold text-brand-navy hover:bg-brand-lime-dark"
                                                >
                                                    <Link
                                                        href={
                                                            isAuthenticated
                                                                ? dashboard()
                                                                : register()
                                                        }
                                                    >
                                                        Register
                                                    </Link>
                                                </Button>
                                            )}
                                            <Button
                                                asChild
                                                variant="outline"
                                                size="sm"
                                            >
                                                {/* Guests hit the auth-gated browse page, bounce
                                                    through login/register, and land back on the
                                                    Open Play dashboard via Laravel's intended-URL
                                                    redirect — signed-in members go straight to
                                                    this session's roster/bracket. */}
                                                <Link
                                                    href={
                                                        isAuthenticated
                                                            ? openPlayShow(
                                                                  session,
                                                              )
                                                            : openPlayBrowse()
                                                    }
                                                >
                                                    Who&apos;s joined / bracket
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

function PhotosTab({
    courts,
    sections = [],
}: {
    courts: Resource[];
    sections?: GallerySection[];
}) {
    // The viewer steps through every photo on the tab, across sections, so
    // each section knows where its photos start in that combined list.
    const allPhotos = sections.flatMap((section) => section.photos);
    const starts = sections.map((_, i) =>
        sections.slice(0, i).reduce((sum, s) => sum + s.photos.length, 0),
    );
    const [viewing, setViewing] = useState<number | null>(null);

    if (allPhotos.length > 0) {
        return (
            <div className="space-y-6">
                {sections.map((section, sectionIndex) => {
                    const start = starts[sectionIndex];

                    return (
                        <Card
                            key={section.id ?? 'uncategorized'}
                            className="border-slate-200 shadow-sm"
                        >
                            <CardHeader className="flex flex-row items-center gap-2 pb-3">
                                <ImageIcon className="size-5 text-brand-court" />
                                <CardTitle className="text-base">
                                    {section.name}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {section.photos.map((photo, i) => (
                                        <button
                                            key={photo.id}
                                            type="button"
                                            onClick={() =>
                                                setViewing(start + i)
                                            }
                                            className="group relative overflow-hidden rounded-lg bg-slate-100 text-left focus-visible:ring-2 focus-visible:ring-brand-lime focus-visible:outline-none"
                                        >
                                            {/* object-contain shows the whole photo; the
                                                tile background fills any letterbox. */}
                                            <img
                                                src={photo.url}
                                                alt={
                                                    photo.caption ??
                                                    `${brand.name} photo`
                                                }
                                                className="aspect-video w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
                                                loading="lazy"
                                            />
                                            {photo.caption ? (
                                                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 text-sm font-semibold text-white">
                                                    {photo.caption}
                                                </span>
                                            ) : null}
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}

                <PhotoLightbox
                    photos={allPhotos}
                    index={viewing}
                    onIndexChange={setViewing}
                />
            </div>
        );
    }

    // Nothing uploaded yet: placeholders built from the courts list.
    return (
        <Card className="border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center gap-2 pb-3">
                <Grid3x3 className="size-5 text-brand-court" />
                <CardTitle className="text-base">Our courts</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {courts.map((court, index) => (
                        <div
                            key={court.id}
                            className={cn(
                                'flex aspect-video items-end rounded-lg bg-gradient-to-br p-4',
                                courtGradients[index % 2],
                            )}
                        >
                            <span className="font-semibold text-white">
                                {court.name} — {court.surface_type}
                            </span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

/** The site footer doubles as the About section — the "About" nav link lands here. */
function SiteFooter({ venue }: { venue?: VenueProfile | null }) {
    const socials = [
        { href: venue?.facebook, icon: Facebook, label: 'Facebook' },
        { href: venue?.instagram, icon: Instagram, label: 'Instagram' },
        { href: venue?.youtube, icon: Youtube, label: 'YouTube' },
    ].filter((social): social is { href: string; icon: LucideIcon; label: string } =>
        Boolean(social.href),
    );
    const highlights: { icon: LucideIcon | typeof RunnerIcon; label: string }[] = [
        { icon: UsersRound, label: 'All skill levels welcome' },
        { icon: Heart, label: 'Fun & friendly community' },
        { icon: RunnerIcon, label: 'Stay active & healthy' },
    ];
    const paragraphs = (venue?.description ?? fallbackDescription)
        .split('\n')
        .filter(Boolean);
    const amenities = venue?.amenities ?? [];
    const address = venue ? venueAddress(venue) : '';
    const headingClass = 'text-xs font-bold tracking-widest text-brand-lime uppercase';

    return (
        <footer id="about" className="scroll-mt-32 bg-brand-navy-dark text-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr] lg:gap-12">
                    <div className="md:col-span-2 lg:col-span-1">
                        <div className="flex items-center gap-3">
                            <img src={brand.logo} alt="" className="size-14 object-contain" />
                            <Wordmark size="lg" />
                        </div>
                        <h2 className="mt-6 text-lg font-bold">About Our Club</h2>
                        <p className="mt-0.5 text-xs text-white/60">
                            A growing community of players who love the game.
                        </p>
                        <div className="mt-3 space-y-3 text-sm leading-relaxed text-white/80">
                            {paragraphs.map((paragraph, index) => (
                                <p key={index}>{paragraph}</p>
                            ))}
                        </div>
                        {socials.length > 0 && (
                            <div className="mt-6 flex items-center gap-3">
                                {socials.map(({ href, icon: Icon, label }) => (
                                    <a
                                        key={label}
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={label}
                                        className="flex size-9 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-brand-lime hover:text-brand-navy"
                                    >
                                        <Icon className="size-4" />
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <h3 className={headingClass}>Why play with us</h3>
                        <ul className="mt-4 space-y-3">
                            {highlights.map(({ icon: Icon, label }) => (
                                <li key={label} className="flex items-center gap-3 text-sm text-white/85">
                                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full ring-1 ring-brand-lime/60">
                                        <Icon className="size-4 text-brand-lime" />
                                    </span>
                                    {label}
                                </li>
                            ))}
                        </ul>
                        <p className="mt-8 font-script text-3xl text-white">
                            Play · Connect · Belong
                        </p>
                        <Swoosh className="-mt-1 w-48 text-brand-lime" />
                    </div>

                    <div>
                        {amenities.length > 0 && (
                            <>
                                <h3 className={headingClass}>Amenities</h3>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {amenities.map((amenity) => {
                                        const Icon = amenityIcon(amenity);

                                        return (
                                            <span
                                                key={amenity}
                                                className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white/85"
                                            >
                                                <Icon className="size-3.5 text-brand-lime" />
                                                {amenity}
                                            </span>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                        {address && (
                            <>
                                <h3 className={cn(headingClass, amenities.length > 0 && 'mt-8')}>Visit us</h3>
                                <p className="mt-4 flex items-start gap-2.5 text-sm leading-relaxed text-white/80">
                                    <MapPin className="mt-0.5 size-4 shrink-0 text-brand-lime" />
                                    {address}
                                </p>
                            </>
                        )}
                    </div>
                </div>
                <p className="border-t border-white/10 py-5 text-center text-xs text-white/60">
                    &copy; {new Date().getFullYear()} {brand.name}. All rights reserved.
                </p>
            </div>
        </footer>
    );
}

export default function Welcome({
    venue,
    courts,
    stats,
    announcements = [],
    openPlaySessions = [],
    bookedSlots = [],
    dateOverrides = [],
    hourlyWeather = {},
    gallery = [],
    coaches = [],
}: Props) {
    const { auth } = usePage().props;
    const businessName = brand.name;
    const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
    const ogImage =
        typeof window !== 'undefined'
            ? `${window.location.origin}${brand.logo}`
            : brand.logo;
    const metaDescription = venue?.description
        ? venue.description.replace(/\s+/g, ' ').trim().slice(0, 155)
        : `Book pickleball courts, billiard and table tennis tables online at ${businessName}. Real-time availability, instant confirmation, open play sessions.`;
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'SportsActivityLocation',
        name: businessName,
        description: metaDescription,
        image: ogImage,
        url: pageUrl,
        ...(venue?.phone ? { telephone: venue.phone } : {}),
        ...(venue?.email ? { email: venue.email } : {}),
        ...(venue && venueAddress(venue)
            ? {
                  address: {
                      '@type': 'PostalAddress',
                      streetAddress: venue.address_line_1 ?? undefined,
                      addressLocality: venue.city ?? undefined,
                      addressRegion: venue.state ?? undefined,
                      postalCode: venue.postal_code ?? undefined,
                      addressCountry: venue.country ?? undefined,
                  },
              }
            : {}),
    };
    const [activeTab, setActiveTab] = useState<ExploreTab>('book');
    const booking = useCourtBooking({
        courts,
        bookedSlots,
        dateOverrides,
        isAuthenticated: !!auth.user,
    });

    const navigate = (key: NavKey) => {
        if (exploreTabs.some((tab) => tab.key === key)) {
            setActiveTab(key as ExploreTab);
            document
                .getElementById('explore')
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' });

            return;
        }

        if (key === 'home') {
            window.scrollTo({ top: 0, behavior: 'smooth' });

            return;
        }

        document
            .getElementById(key)
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const pickleballCourts = courts.filter((court) => court.sport === 'pickleball').length;

    return (
        <>
            <Head title={businessName}>
                <meta name="description" content={metaDescription} />
                {pageUrl && <link rel="canonical" href={pageUrl} />}
                <meta property="og:type" content="website" />
                <meta property="og:title" content={businessName} />
                <meta property="og:description" content={metaDescription} />
                <meta property="og:image" content={ogImage} />
                {pageUrl && <meta property="og:url" content={pageUrl} />}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={businessName} />
                <meta name="twitter:description" content={metaDescription} />
                <meta name="twitter:image" content={ogImage} />
                <link rel="preload" as="image" href={heroImage} />
                <script type="application/ld+json">
                    {JSON.stringify(structuredData)}
                </script>
            </Head>

            {/* overflow-x-clip, not -hidden: "hidden" turns this div into a scroll
                container, and the sticky header would stick to it instead of the window. */}
            <div className="animate-page-enter min-h-screen overflow-x-clip bg-slate-100 text-brand-navy">
                <SiteHeader onNavigate={navigate} />

                <Hero
                    venue={venue}
                    onBook={() => navigate('book')}
                    onOpenPlay={() => navigate('open-play')}
                />

                <StatsBar
                    items={[
                        { label: 'Pickleball Courts', value: pickleballCourts, icon: LandPlot },
                        { label: 'Available Slots Today', value: stats.available_slots_today, icon: CalendarDays },
                        { label: 'Active Members', value: stats.members, icon: UsersRound },
                    ]}
                />

                <main className="mx-auto max-w-7xl px-4 pt-6 pb-16 sm:px-6 lg:px-8">
                    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                        <section
                            id="explore"
                            className={cn(panelClass, 'scroll-mt-32 overflow-hidden')}
                        >
                            <Tabs
                                value={activeTab}
                                onValueChange={(value) => {
                                    setActiveTab(value as ExploreTab);
                                }}
                                className="gap-0"
                            >
                                <TabsList className="flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-none border-b border-slate-200 bg-slate-50 p-1.5 [scrollbar-width:none] sm:p-2">
                                    {exploreTabs.map(({ key, label, icon: Icon }) => (
                                        <TabsTrigger
                                            key={key}
                                            value={key}
                                            className="flex-1 shrink-0 gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold text-slate-500 data-[state=active]:bg-brand-navy data-[state=active]:text-white data-[state=active]:shadow-sm sm:text-sm"
                                        >
                                            <Icon
                                                className={cn(
                                                    'size-4',
                                                    activeTab === key && 'text-brand-lime',
                                                )}
                                            />
                                            {label}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>

                                <div className="p-4 sm:p-6">
                                    <TabsContent value="book" className="mt-0">
                                        <BookYourCourt booking={booking} hourlyWeather={hourlyWeather} />
                                    </TabsContent>

                                    <TabsContent value="open-play" className="mt-0 space-y-5">
                                        <PanelTitle
                                            icon={RunnerIcon}
                                            title="Open Play"
                                            subtitle="Join a scheduled session, meet new players, and enjoy the game."
                                        />
                                        <OpenPlayTab
                                            sessions={openPlaySessions}
                                            isAuthenticated={!!auth.user}
                                        />
                                    </TabsContent>

                                    <TabsContent value="coaches" className="mt-0 space-y-5">
                                        <PanelTitle
                                            icon={GraduationCap}
                                            title="Train with our Coaches"
                                            subtitle="Private and group lessons for every level — from your first dink to tournament play."
                                        />
                                        <CoachesTab coaches={coaches} />
                                    </TabsContent>

                                    <TabsContent value="photos" className="mt-0 space-y-5">
                                        <PanelTitle
                                            icon={ImageIcon}
                                            title="Photos"
                                            subtitle="A look around our courts and community."
                                        />
                                        <PhotosTab courts={courts} sections={gallery} />
                                    </TabsContent>
                                </div>
                            </Tabs>
                        </section>

                        <div className="grid items-start gap-5 md:grid-cols-2 lg:grid-cols-1">
                            <LocationCard venue={venue} dateOverrides={dateOverrides} />
                            <NewsCard announcements={announcements} />
                            <PromoCard onClick={() => navigate('open-play')} />
                        </div>
                    </div>
                </main>

                <SiteFooter venue={venue} />
            </div>

            <SupportWidget avoidBottomNav={false} />
        </>
    );
}
