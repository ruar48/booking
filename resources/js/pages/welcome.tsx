import { Head, Link, usePage } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import {
    ArrowRight,
    Calendar,
    CalendarDays,
    ChevronDown,
    Clock,
    Grid3x3,
    ImageIcon,
    Info,
    Mail,
    MapPin,
    Megaphone,
    Phone,
    Users,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { CourtScheduleGrid } from '@/components/court-schedule-grid';
import { BrandLogo } from '@/components/brand-logo';
import { InstallAppButton } from '@/components/install-app-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { brand } from '@/lib/brand';
import { formatCurrency, formatDate, formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { dashboard, login, register } from '@/routes';
import { index as bookingsIndex } from '@/routes/bookings';
import type {
    Announcement,
    BookedSlot,
    DateOverride,
    OpenPlaySession,
    Resource,
    VenueProfile,
} from '@/types/booking';

type HomeStats = {
    courts: number;
    members: number;
    bookings_today: number;
};

type Props = {
    venue?: VenueProfile | null;
    courts: Resource[];
    stats: HomeStats;
    announcements?: Announcement[];
    openPlaySessions?: OpenPlaySession[];
    bookedSlots?: BookedSlot[];
    dateOverrides?: DateOverride[];
};

const DAY_ORDER = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
] as const;

const DAY_LABELS: Record<(typeof DAY_ORDER)[number], string> = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
};

function venueAddress(venue: VenueProfile): string {
    return [venue.address_line_1, venue.city, venue.state, venue.postal_code]
        .filter(Boolean)
        .join(', ');
}

function formatHoursRange(open?: string | null, close?: string | null): string {
    if (!open || !close) {
        return 'Closed';
    }

    const toLabel = (time: string) => {
        const [hour, minute] = time.split(':').map(Number);
        const date = new Date();
        date.setHours(hour, minute, 0, 0);
        return format(date, 'ha').toLowerCase();
    };

    return `${toLabel(open)} to ${toLabel(close)}`;
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

function HeroLanding({
    venue,
    businessName,
    stats,
    onExplore,
    onBook,
}: {
    venue?: VenueProfile | null;
    businessName: string;
    stats: HomeStats;
    onExplore: () => void;
    onBook: () => void;
}) {
    const { auth } = usePage().props;
    const accountHref = auth.user?.isVenueAdmin ? dashboard() : bookingsIndex();

    return (
        <section className="relative flex min-h-screen flex-col overflow-hidden bg-brand-navy text-white">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-navy via-brand-navy-light to-brand-court/80" />
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-20 -right-20 size-72 rounded-full bg-brand-lime/10 blur-3xl" />
                <div className="absolute bottom-20 -left-16 size-56 rounded-full bg-brand-court/20 blur-2xl" />
            </div>

            <header className="relative z-10 border-b border-brand-lime/10 bg-brand-navy/80 backdrop-blur-md">
                <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <Link href="/">
                        <BrandLogo
                            imageClassName="size-11 sm:size-12"
                            showName
                            nameClassName="hidden text-white sm:inline"
                        />
                    </Link>

                    <nav className="hidden items-center gap-8 text-sm font-semibold md:flex">
                        <button
                            type="button"
                            onClick={onBook}
                            className="text-white/70 transition-colors hover:text-brand-lime"
                        >
                            Courts
                        </button>
                        <button
                            type="button"
                            onClick={onExplore}
                            className="text-white/70 transition-colors hover:text-brand-lime"
                        >
                            Photos
                        </button>
                    </nav>

                    <div className="flex items-center gap-2">
                        <InstallAppButton
                            variant="outline"
                            iconOnly
                            className="border-2 border-white/70 bg-transparent text-white shadow-none hover:bg-white/10 hover:text-white sm:hidden"
                        />
                        <InstallAppButton
                            variant="outline"
                            className="hidden border-2 border-white/70 bg-transparent text-white shadow-none hover:bg-white/10 hover:text-white sm:inline-flex"
                        />
                        {auth.user ? (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={onBook}
                                    className="hidden border-2 border-white/70 bg-transparent text-white shadow-none hover:bg-white/10 hover:text-white sm:inline-flex"
                                >
                                    Book a court
                                </Button>
                                <Button
                                    asChild
                                    className="bg-brand-lime font-bold text-brand-navy hover:bg-brand-lime-dark"
                                >
                                    <Link href={accountHref}>My account</Link>
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    variant="outline"
                                    asChild
                                    className="border-2 border-white/70 bg-transparent text-white shadow-none hover:bg-white/10 hover:text-white"
                                >
                                    <Link href={login()}>Log in</Link>
                                </Button>
                                <Button
                                    onClick={onBook}
                                    className="bg-brand-lime font-bold text-brand-navy hover:bg-brand-lime-dark"
                                >
                                    Book a court
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <div className="relative z-10 mx-auto flex flex-1 max-w-7xl flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
                <div className="grid items-center gap-12 lg:grid-cols-2">
                    <div className="min-w-0">
                        <Badge className="mb-6 border-brand-lime/40 bg-brand-lime/15 text-brand-lime">
                            {brand.tagline} · Pickleball
                        </Badge>
                        <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                            Welcome to{' '}
                            <span className="text-brand-lime">{businessName}</span>
                        </h1>
                        <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/80">
                            {venue?.description ??
                                'Reserve a court online. Simple scheduling for open play and private sessions.'}
                        </p>
                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <Button
                                size="lg"
                                onClick={onBook}
                                className="bg-brand-lime font-bold text-brand-navy hover:bg-brand-lime-dark"
                            >
                                Book a court
                                <ArrowRight className="ml-2 size-4" />
                            </Button>
                            {!auth.user && (
                                <Button
                                    size="lg"
                                    variant="outline"
                                    asChild
                                    className="border-2 border-white/90 bg-transparent font-semibold text-white shadow-none hover:bg-white/15 hover:text-white"
                                >
                                    <Link href={login()}>Member login</Link>
                                </Button>
                            )}
                        </div>
                        {venue && venueAddress(venue) && (
                            <p className="mt-6 flex items-center gap-2 text-sm text-white/60">
                                <MapPin className="size-4 shrink-0 text-brand-lime" />
                                {venueAddress(venue)}
                            </p>
                        )}
                    </div>

                    <div className="flex justify-center overflow-hidden">
                        <img
                            src={brand.logo}
                            alt={businessName}
                            className="size-48 max-w-full object-contain drop-shadow-2xl sm:size-64 lg:size-72"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    {[
                        { label: 'Pickleball courts', value: stats.courts },
                        { label: 'Active members', value: stats.members },
                        { label: 'Bookings today', value: stats.bookings_today },
                    ].map((stat) => (
                        <div
                            key={stat.label}
                            className="rounded-2xl border border-brand-lime/20 bg-white/10 p-3 text-center backdrop-blur-sm sm:p-5"
                        >
                            <p className="text-2xl font-bold text-brand-lime sm:text-3xl">{stat.value}</p>
                            <p className="mt-1 text-xs text-white/70 sm:text-sm">{stat.label}</p>
                        </div>
                    ))}
                </div>

                <button
                    type="button"
                    onClick={onExplore}
                    className="mt-12 flex flex-col items-center gap-2 self-center text-sm text-white/60 transition-colors hover:text-brand-lime"
                    aria-label="Scroll to venue details"
                >
                    <span>Explore our courts</span>
                    <ChevronDown className="size-5 animate-bounce" />
                </button>
            </div>
        </section>
    );
}

function AboutTab({ venue }: { venue: VenueProfile }) {
    const hours = venue.operating_hours ?? {};
    const amenities = venue.amenities ?? [];

    return (
        <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="flex flex-row items-center gap-2 pb-3">
                    <Info className="size-5 text-brand-court" />
                    <CardTitle className="text-base">About</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm leading-relaxed text-slate-600">
                    {(venue.description ?? '').split('\n').map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                    ))}
                </CardContent>
            </Card>

            <div className="space-y-4">
                <Card className="border-slate-200 shadow-sm">
                    <CardContent className="space-y-3 pt-6 text-sm">
                        {venue.phone && (
                            <div className="flex items-center gap-3">
                                <Phone className="size-4 text-brand-court" />
                                <a href={`tel:${venue.phone}`} className="hover:underline">
                                    {venue.phone}
                                </a>
                            </div>
                        )}
                        {venue.email && (
                            <div className="flex items-center gap-3">
                                <Mail className="size-4 text-brand-court" />
                                <a href={`mailto:${venue.email}`} className="hover:underline">
                                    {venue.email}
                                </a>
                            </div>
                        )}
                        {venueAddress(venue) && (
                            <div className="flex items-start gap-3">
                                <MapPin className="mt-0.5 size-4 shrink-0 text-brand-court" />
                                <span>{venueAddress(venue)}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="flex flex-row items-center gap-2 pb-3">
                        <Clock className="size-5 text-brand-court" />
                        <CardTitle className="text-base">Operating hours</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-2 sm:grid-cols-2">
                        {DAY_ORDER.map((day) => {
                            const schedule = hours[day];
                            if (!schedule) {
                                return null;
                            }

                            return (
                                <div
                                    key={day}
                                    className="flex justify-between gap-4 text-sm"
                                >
                                    <span className="font-medium text-slate-700">
                                        {DAY_LABELS[day]}
                                    </span>
                                    <span className="text-slate-500">
                                        {formatHoursRange(schedule.open, schedule.close)}
                                    </span>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>

                {amenities.length > 0 && (
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Amenities</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-2">
                            {amenities.map((amenity) => (
                                <Badge
                                    key={amenity}
                                    variant="secondary"
                                    className="bg-slate-100 text-slate-600"
                                >
                                    {amenity}
                                </Badge>
                            ))}
                        </CardContent>
                    </Card>
                )}
            </div>
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
    const grouped = sessions.reduce<Record<string, OpenPlaySession[]>>((acc, session) => {
        const day = session.starts_at.split('T')[0];
        acc[day] = acc[day] ?? [];
        acc[day].push(session);
        return acc;
    }, {});

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
                            <Card key={session.id} className="border-slate-200 shadow-sm">
                                <CardContent className="pt-6">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="space-y-3">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="font-bold text-slate-800">
                                                    {session.title}
                                                </h3>
                                                <Badge variant="secondary">
                                                    {formatSkillLevel(session.skill_level)}
                                                </Badge>
                                            </div>
                                            <ul className="space-y-1.5 text-sm text-slate-600">
                                                <li className="flex items-center gap-2">
                                                    <Clock className="size-4 text-brand-court" />
                                                    {formatTime(session.starts_at)}
                                                    {session.ends_at &&
                                                        ` – ${formatTime(session.ends_at)}`}
                                                </li>
                                                {session.location && (
                                                    <li className="flex items-center gap-2">
                                                        <MapPin className="size-4 text-brand-court" />
                                                        {session.location}
                                                    </li>
                                                )}
                                                {session.max_players && (
                                                    <li className="flex items-center gap-2">
                                                        <Users className="size-4 text-brand-court" />
                                                        0/{session.max_players} players
                                                    </li>
                                                )}
                                            </ul>
                                        </div>
                                        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                                            {session.price_per_player != null && (
                                                <p className="text-sm font-semibold text-slate-700">
                                                    {formatCurrency(session.price_per_player)}{' '}
                                                    <span className="font-normal text-slate-500">
                                                        per player
                                                    </span>
                                                </p>
                                            )}
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

function BookCourtTab({
    courts,
    bookedSlots,
    dateOverrides,
    isAuthenticated,
}: {
    courts: Resource[];
    bookedSlots: BookedSlot[];
    dateOverrides: DateOverride[];
    isAuthenticated: boolean;
}) {
    return (
        <CourtScheduleGrid
            courts={courts}
            bookedSlots={bookedSlots}
            dateOverrides={dateOverrides}
            isAuthenticated={isAuthenticated}
        />
    );
}

function PhotosTab({ courts, gallery = [] }: { courts: Resource[]; gallery?: string[] }) {
    return (
        <div className="space-y-6">
            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="flex flex-row items-center gap-2 pb-3">
                    <ImageIcon className="size-5 text-brand-court" />
                    <CardTitle className="text-base">Gallery</CardTitle>
                </CardHeader>
                <CardContent>
                    {gallery.length > 0 ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                            {gallery.map((photo, index) => (
                                <img
                                    key={index}
                                    src={photo}
                                    alt=""
                                    className="aspect-video rounded-lg object-cover"
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
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
                    )}
                </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="flex flex-row items-center gap-2 pb-3">
                    <Grid3x3 className="size-5 text-brand-court" />
                    <CardTitle className="text-base">Our courts</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {courts.map((court, index) => (
                            <div
                                key={court.id}
                                className="overflow-hidden rounded-xl border border-slate-200"
                            >
                                <div
                                    className={cn(
                                        'relative flex aspect-[4/3] items-end justify-center bg-gradient-to-br p-4',
                                        courtGradients[index % 2],
                                    )}
                                >
                                    <span className="rounded-full bg-black/40 px-4 py-1 text-sm font-semibold text-white">
                                        {court.name}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function NewsTab({ announcements }: { announcements: Announcement[] }) {
    if (!announcements.length) {
        return (
            <Card className="border-slate-200 shadow-sm">
                <CardContent className="py-12 text-center text-sm text-slate-500">
                    No news posted yet.
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {announcements.map((announcement) => (
                <Card key={announcement.id} className="border-slate-200 shadow-sm">
                    <CardHeader className="pb-2">
                        <div className="flex items-start gap-2">
                            <Megaphone className="mt-0.5 size-4 shrink-0 text-brand-court" />
                            <div>
                                <CardTitle className="text-base">
                                    {announcement.title}
                                </CardTitle>
                                {announcement.published_at && (
                                    <p className="text-muted-foreground mt-1 text-xs">
                                        {formatDate(announcement.published_at)}
                                    </p>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm leading-relaxed text-slate-600">
                            {announcement.content}
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
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
}: Props) {
    const { auth } = usePage().props;
    const businessName = brand.name;
    const [activeTab, setActiveTab] = useState('about');
    const venueSection = useRef<HTMLElement>(null);
    const [venueVisible, setVenueVisible] = useState(false);

    useEffect(() => {
        const element = venueSection.current;
        if (!element) {
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVenueVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
        );

        observer.observe(element);

        return () => observer.disconnect();
    }, []);

    const scrollToVenue = (tab = 'about') => {
        setActiveTab(tab);
        venueSection.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <>
            <Head title={businessName} />

            <div className="overflow-x-hidden bg-slate-100 text-brand-navy">
                <HeroLanding
                    venue={venue}
                    businessName={businessName}
                    stats={stats}
                    onExplore={() => scrollToVenue('about')}
                    onBook={() => scrollToVenue('book')}
                />

                <section
                    ref={venueSection}
                    id="venue"
                    className={cn(
                        'relative overflow-hidden px-4 py-16 transition-all duration-700 ease-out sm:py-20',
                        venueVisible
                            ? 'animate-venue-boom opacity-100'
                            : 'translate-y-16 opacity-0',
                    )}
                >
                    <main className="mx-auto max-w-4xl">
                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                            <div className="flex flex-col items-center px-6 pt-8 pb-6 text-center">
                                <div className="mb-4 overflow-hidden rounded-full border-4 border-slate-100 bg-white shadow-md">
                                    <img
                                        src={brand.logo}
                                        alt={businessName}
                                        className="size-20 object-contain p-2 sm:size-24"
                                    />
                                </div>
                                <h2 className="text-2xl font-extrabold text-brand-navy">
                                    {businessName}
                                </h2>
                                {venue && venueAddress(venue) ? (
                                    <p className="mt-1 flex items-center justify-center gap-1 text-sm text-slate-500">
                                        <MapPin className="size-3.5" />
                                        {venueAddress(venue)}
                                    </p>
                                ) : (
                                    <p className="mt-2 text-sm text-slate-500">
                                        {stats.courts} pickleball courts · Online booking
                                    </p>
                                )}
                                <Button
                                    className="mt-4 bg-brand-lime font-bold text-brand-navy hover:bg-brand-lime-dark"
                                    onClick={() => setActiveTab('book')}
                                >
                                    <Calendar className="mr-2 size-4" />
                                    Book a court
                                </Button>
                            </div>

                            <Tabs
                                value={activeTab}
                                onValueChange={setActiveTab}
                                className="gap-0"
                            >
                                <div className="border-y border-slate-200 bg-slate-50 px-2 py-2 sm:px-4">
                                    <TabsList className="grid h-auto w-full grid-cols-5 gap-1 bg-transparent p-0">
                                        <TabsTrigger
                                            value="about"
                                            className="data-[state=active]:border-brand-lime data-[state=active]:bg-white data-[state=active]:text-brand-navy rounded-lg border border-transparent px-3 py-2.5 text-xs font-semibold sm:text-sm"
                                        >
                                            About
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="open-play"
                                            className="data-[state=active]:border-brand-lime data-[state=active]:bg-white data-[state=active]:text-brand-navy rounded-lg border border-transparent px-3 py-2.5 text-xs font-semibold sm:text-sm"
                                        >
                                            Open play
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="book"
                                            className="data-[state=active]:border-brand-lime data-[state=active]:bg-white data-[state=active]:text-brand-navy rounded-lg border border-transparent px-3 py-2.5 text-xs font-semibold sm:text-sm"
                                        >
                                            Book a court
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="photos"
                                            className="data-[state=active]:border-brand-lime data-[state=active]:bg-white data-[state=active]:text-brand-navy rounded-lg border border-transparent px-3 py-2.5 text-xs font-semibold sm:text-sm"
                                        >
                                            Photos
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="news"
                                            className="data-[state=active]:border-brand-lime data-[state=active]:bg-white data-[state=active]:text-brand-navy rounded-lg border border-transparent px-3 py-2.5 text-xs font-semibold sm:text-sm"
                                        >
                                            News
                                        </TabsTrigger>
                                    </TabsList>
                                </div>

                                <div className="p-4 sm:p-6">
                                    <TabsContent value="about" className="mt-0">
                                        {venue ? (
                                            <AboutTab venue={venue} />
                                        ) : (
                                            <p className="text-sm text-slate-500">
                                                Venue information is not available.
                                            </p>
                                        )}
                                    </TabsContent>

                                    <TabsContent value="open-play" className="mt-0">
                                        <OpenPlayTab
                                            sessions={openPlaySessions}
                                            isAuthenticated={!!auth.user}
                                        />
                                    </TabsContent>

                                    <TabsContent value="book" className="mt-0">
                                        <BookCourtTab
                                            courts={courts}
                                            bookedSlots={bookedSlots}
                                            dateOverrides={dateOverrides}
                                            isAuthenticated={!!auth.user}
                                        />
                                    </TabsContent>

                                    <TabsContent value="photos" className="mt-0">
                                        <PhotosTab courts={courts} gallery={venue?.gallery ?? []} />
                                    </TabsContent>

                                    <TabsContent value="news" className="mt-0">
                                        <NewsTab announcements={announcements} />
                                    </TabsContent>
                                </div>
                            </Tabs>
                        </div>
                    </main>
                </section>

                <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">
                    &copy; {new Date().getFullYear()} {businessName}
                </footer>
            </div>
        </>
    );
}
