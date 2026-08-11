import { Head, Link, usePage } from '@inertiajs/react';
import {
    differenceInMinutes,
    format,
    isAfter,
    isWithinInterval,
    parseISO,
} from 'date-fns';
import type { ReactNode } from 'react';
import {
    Calendar,
    CalendarClock,
    CalendarPlus,
    DollarSign,
    ListPlus,
    MapPin,
    Megaphone,
    TrendingDown,
    TrendingUp,
    UserPlus,
    Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    formatCurrency,
    formatStatusLabel,
    formatTime,
    monthLabel,
} from '@/lib/format';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import { index as announcementsIndex } from '@/routes/announcements';
import { create as createBooking, index as bookingsIndex, show as showBooking } from '@/routes/bookings';
import { create as createOpenPlay, edit as editOpenPlay, index as openPlayIndex } from '@/routes/open-play';
import { create as createPlayer } from '@/routes/players';
import { create as createResource } from '@/routes/resources';
import type {
    Announcement,
    BookingStatusBreakdownPoint,
    DashboardData,
    OpenPlaySession,
    Resource,
    ResourceBooking,
} from '@/types/booking';

type Props = {
    data: DashboardData;
};

const BOOKING_STATUS_COLORS: Record<string, string> = {
    pending: '#eda100',
    approved: '#1baf7a',
    completed: '#2a78d6',
    cancelled: '#898781',
    rejected: '#e34948',
};

type LiveStatus = 'available' | 'reserved_soon' | 'occupied' | 'other';

const LIVE_STATUS_META: Record<LiveStatus, { label: string; dot: string }> = {
    available: { label: 'Available', dot: 'bg-emerald-500' },
    reserved_soon: { label: 'Reserved Soon', dot: 'bg-amber-500' },
    occupied: { label: 'Occupied', dot: 'bg-red-500' },
    other: { label: '', dot: 'bg-zinc-500' },
};

export default function Dashboard({ data }: Props) {
    const { auth } = usePage().props;
    const {
        stats,
        resourceAvailability = [],
        revenueChart = [],
        bookingStatusBreakdown = [],
        recentBookings,
        openPlaySessions = [],
        announcements,
    } = data;

    const now = new Date();
    const hour = now.getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    const firstName = auth.user?.name?.split(' ')[0] ?? '';

    const revenueData = revenueChart.map((point) => ({
        label: monthLabel(point.year, point.month),
        total: point.total,
    }));

    const bookingsTrend = pctChange(stats.bookings_today, stats.bookings_yesterday);
    const revenueTrend = pctChange(stats.revenue_this_month, stats.revenue_last_month);
    const avgBookingValue = stats.bookings_this_month > 0
        ? stats.revenue_this_month / stats.bookings_this_month
        : 0;

    const totalStatusCount = bookingStatusBreakdown.reduce((sum, entry) => sum + entry.count, 0);

    const scheduleEvents = resourceAvailability
        .flatMap((resource) =>
            (resource.bookings ?? []).map((booking) => ({ ...booking, resourceName: resource.name })),
        )
        .sort((a, b) => a.starts_at.localeCompare(b.starts_at));

    return (
        <>
            <Head title="Dashboard" />

            <div className="flex flex-1 flex-col gap-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            👋 {greeting}{firstName ? `, ${firstName}` : ''}
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            {format(now, 'MMM d, yyyy')} · Here's what's happening at your venue today
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button size="sm" asChild>
                            <Link href={createBooking()}>
                                <CalendarPlus />
                                New Booking
                            </Link>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                            <Link href={createPlayer()}>
                                <UserPlus />
                                Add Member
                            </Link>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                            <Link href={createOpenPlay()}>
                                <ListPlus />
                                Open Play
                            </Link>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                            <Link href={announcementsIndex()}>
                                <Megaphone />
                                Announcement
                            </Link>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                            <Link href={createResource()}>
                                <MapPin />
                                Court
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <KpiCard
                        label="Members"
                        value={stats.active_players ?? stats.players}
                        icon={Users}
                        iconClassName="bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        subtitle={
                            stats.members_new_this_week > 0 ? (
                                <span className="text-emerald-600 dark:text-emerald-400">
                                    +{stats.members_new_this_week} this week
                                </span>
                            ) : (
                                'No new members this week'
                            )
                        }
                    />
                    <KpiCard
                        label="Courts"
                        value={stats.courts}
                        icon={MapPin}
                        iconClassName="bg-violet-500/10 text-violet-600 dark:text-violet-400"
                        subtitle={
                            stats.courts_available === stats.courts
                                ? 'All operational'
                                : `${stats.courts_available}/${stats.courts} available`
                        }
                    />
                    <KpiCard
                        label="Bookings Today"
                        value={stats.bookings_today}
                        icon={Calendar}
                        iconClassName="bg-orange-500/10 text-orange-600 dark:text-orange-400"
                        subtitle={<TrendText value={bookingsTrend} label="vs yesterday" />}
                    />
                    <KpiCard
                        label="Revenue This Month"
                        value={formatCurrency(stats.revenue_this_month)}
                        icon={DollarSign}
                        iconClassName="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        subtitle={<TrendText value={revenueTrend} label="this month" />}
                    />
                </div>

                <div>
                    <Card>
                        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <CardTitle>Revenue</CardTitle>
                                <CardDescription>Monthly booking income</CardDescription>
                            </div>
                            <div className="flex gap-6 text-right">
                                <div>
                                    <p className="text-muted-foreground text-xs">Total revenue</p>
                                    <p className="text-sm font-semibold tabular-nums">
                                        {formatCurrency(stats.revenue_this_month)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs">Avg booking</p>
                                    <p className="text-sm font-semibold tabular-nums">
                                        {formatCurrency(avgBookingValue)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs">Bookings</p>
                                    <p className="text-sm font-semibold tabular-nums">
                                        {stats.bookings_this_month}
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {revenueData.length ? (
                                <ResponsiveContainer width="100%" height={260}>
                                    <AreaChart data={revenueData}>
                                        <defs>
                                            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.35} />
                                                <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                                        <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                                        <YAxis
                                            tick={{ fontSize: 12 }}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(v) => formatCurrency(Number(v)).replace(/\.00$/, '')}
                                            width={64}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'var(--color-popover)',
                                                border: '1px solid var(--color-border)',
                                                borderRadius: 8,
                                                fontSize: 12,
                                            }}
                                            formatter={(value) => formatCurrency(Number(value ?? 0))}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="total"
                                            stroke="var(--chart-2)"
                                            strokeWidth={2}
                                            fill="url(#revenueFill)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-muted-foreground py-16 text-center text-sm">No revenue data yet</p>
                            )}
                        </CardContent>
                    </Card>

                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CalendarClock className="size-4" />
                                Today's schedule
                            </CardTitle>
                            <CardDescription>All court bookings for today, in order</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {scheduleEvents.length ? (
                                <ul>
                                    {scheduleEvents.map((event) => (
                                        <ScheduleItem key={event.id} event={event} />
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-muted-foreground py-6 text-center text-sm">
                                    No bookings scheduled today
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <div className="space-y-4">
                        {resourceAvailability.length ? (
                            resourceAvailability.map((resource) => (
                                <CourtStatusCard key={resource.id} resource={resource} now={now} />
                            ))
                        ) : (
                            <Card>
                                <CardContent className="text-muted-foreground text-sm">
                                    No courts configured
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Recent bookings</CardTitle>
                            <CardDescription>
                                {stats.pending_bookings > 0
                                    ? `${stats.pending_bookings} awaiting payment`
                                    : 'Latest reservations'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {recentBookings?.length ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Player</TableHead>
                                            <TableHead>Court</TableHead>
                                            <TableHead>Time</TableHead>
                                            <TableHead className="text-right">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recentBookings.map((booking) => (
                                            <TableRow key={booking.id}>
                                                <TableCell>
                                                    <Link
                                                        href={showBooking(booking)}
                                                        className="font-medium hover:underline"
                                                    >
                                                        {booking.user?.name ?? 'Guest'}
                                                    </Link>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {booking.resource?.name ?? 'Court'}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {formatTime(booking.starts_at)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <StatusBadge status={booking.status} />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <p className="text-muted-foreground text-sm">No bookings yet</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Booking status</CardTitle>
                            <CardDescription>This month, by status</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {bookingStatusBreakdown.length ? (
                                <div className="flex items-center gap-2">
                                    <ResponsiveContainer width="45%" height={150}>
                                        <PieChart>
                                            <Pie
                                                data={bookingStatusBreakdown}
                                                dataKey="count"
                                                nameKey="status"
                                                innerRadius={38}
                                                outerRadius={60}
                                                paddingAngle={2}
                                                stroke="var(--color-card)"
                                                strokeWidth={2}
                                            >
                                                {bookingStatusBreakdown.map((entry) => (
                                                    <Cell
                                                        key={entry.status}
                                                        fill={BOOKING_STATUS_COLORS[entry.status] ?? '#a1a1aa'}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'var(--color-popover)',
                                                    border: '1px solid var(--color-border)',
                                                    borderRadius: 8,
                                                    fontSize: 12,
                                                }}
                                                formatter={(value, _name, entry) => [
                                                    `${value} bookings`,
                                                    formatStatusLabel(
                                                        String(
                                                            (entry?.payload as BookingStatusBreakdownPoint)?.status ?? '',
                                                        ),
                                                    ),
                                                ]}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <ul className="flex-1 space-y-2 text-xs">
                                        {bookingStatusBreakdown.map((entry) => (
                                            <li key={entry.status} className="flex items-center justify-between gap-2">
                                                <span className="flex items-center gap-1.5">
                                                    <span
                                                        className="size-2 shrink-0 rounded-full"
                                                        style={{
                                                            backgroundColor:
                                                                BOOKING_STATUS_COLORS[entry.status] ?? '#a1a1aa',
                                                        }}
                                                    />
                                                    {formatStatusLabel(entry.status)}
                                                </span>
                                                <span className="text-muted-foreground tabular-nums">
                                                    {totalStatusCount > 0
                                                        ? Math.round((entry.count / totalStatusCount) * 100)
                                                        : 0}
                                                    %
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : (
                                <p className="text-muted-foreground py-10 text-center text-sm">
                                    No bookings this month
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardHeader className="flex flex-row items-start justify-between gap-4">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <CalendarClock className="size-4" />
                                    Open play
                                </CardTitle>
                                <CardDescription>
                                    Upcoming drop-in sessions on your public page
                                </CardDescription>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                                <Link href={openPlayIndex()}>Manage</Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {openPlaySessions.length ? (
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {openPlaySessions.map((session) => (
                                        <OpenPlayCard key={session.id} session={session} />
                                    ))}
                                </div>
                            ) : (
                                <div className="py-6 text-center">
                                    <p className="text-muted-foreground text-sm">
                                        No upcoming sessions
                                    </p>
                                    <Button size="sm" className="mt-3" asChild>
                                        <Link href={createOpenPlay()}>Schedule open play</Link>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between gap-4">
                            <CardTitle className="flex items-center gap-2">
                                <Megaphone className="size-4" />
                                Latest news
                            </CardTitle>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href={announcementsIndex()}>View all</Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {announcements?.length ? (
                                <ul className="space-y-3">
                                    {announcements.slice(0, 4).map((item) => (
                                        <AnnouncementItem key={item.id} announcement={item} />
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-muted-foreground text-sm">No announcements</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

function pctChange(current: number, previous: number): number | null {
    if (previous <= 0) {
        return null;
    }

    return Math.round(((current - previous) / previous) * 100);
}

function getLiveStatus(resource: Resource, now: Date): LiveStatus {
    if (resource.status !== 'available') {
        return 'other';
    }

    const bookings = resource.bookings ?? [];

    const active = bookings.find((booking) =>
        isWithinInterval(now, { start: parseISO(booking.starts_at), end: parseISO(booking.ends_at) }),
    );

    if (active) {
        return 'occupied';
    }

    const soon = bookings.find((booking) => {
        const start = parseISO(booking.starts_at);

        return isAfter(start, now) && differenceInMinutes(start, now) <= 60;
    });

    if (soon) {
        return 'reserved_soon';
    }

    return 'available';
}

type KpiCardProps = {
    label: string;
    value: string | number;
    icon: LucideIcon;
    iconClassName: string;
    subtitle: ReactNode;
};

function KpiCard({ label, value, icon: Icon, iconClassName, subtitle }: KpiCardProps) {
    return (
        <Card className="gap-4 py-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 pb-0">
                <CardTitle className="text-muted-foreground text-sm font-medium">{label}</CardTitle>
                <div className={cn('rounded-md p-2', iconClassName)}>
                    <Icon className="size-4" />
                </div>
            </CardHeader>
            <CardContent className="px-4">
                <div className="text-2xl font-bold">{value}</div>
                <div className="text-muted-foreground mt-1 text-xs">{subtitle}</div>
            </CardContent>
        </Card>
    );
}

function TrendText({ value, label }: { value: number | null; label: string }) {
    if (value === null) {
        return <span>{label}</span>;
    }

    const isPositive = value >= 0;

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1',
                isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
            )}
        >
            {isPositive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
            {isPositive ? '+' : ''}
            {value}%
            <span className="text-muted-foreground">{label}</span>
        </span>
    );
}

function ScheduleItem({ event }: { event: ResourceBooking & { resourceName: string } }) {
    return (
        <li className="flex gap-3 border-l pl-3 pb-4 last:pb-0">
            <span className="text-muted-foreground -ml-[1.65rem] w-14 shrink-0 text-xs font-medium tabular-nums">
                {formatTime(event.starts_at)}
            </span>
            <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{event.resourceName}</p>
                    <StatusBadge status={event.status} />
                </div>
                <p className="text-muted-foreground text-xs">
                    {event.user?.name ?? 'Guest'} · {formatTime(event.starts_at)}–{formatTime(event.ends_at)}
                </p>
            </div>
        </li>
    );
}

function CourtStatusCard({ resource, now }: { resource: Resource; now: Date }) {
    const bookingsToday = resource.bookings?.length ?? 0;
    const live = getLiveStatus(resource, now);
    const meta = LIVE_STATUS_META[live];

    return (
        <Card className="gap-3 py-3">
            <CardContent className="px-4">
                <div className="flex items-center justify-between gap-2">
                    <p className="flex items-center gap-1.5 text-sm font-semibold">
                        <MapPin className="text-muted-foreground size-3.5" />
                        {resource.name}
                    </p>
                    <span className="flex items-center gap-1.5 text-xs font-medium whitespace-nowrap">
                        <span className={cn('size-2 rounded-full', meta.dot)} />
                        {live === 'other' ? formatStatusLabel(resource.status) : meta.label}
                    </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                        <p className="text-muted-foreground">Today's bookings</p>
                        <p className="font-medium">{bookingsToday}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">Rate</p>
                        <p className="font-medium">{formatCurrency(resource.hourly_rate)}/hr</p>
                    </div>
                </div>
                <Button variant="outline" size="sm" className="mt-3 w-full" asChild>
                    <Link href={bookingsIndex({ query: { resource_id: resource.id } })}>View Schedule</Link>
                </Button>
            </CardContent>
        </Card>
    );
}

function OpenPlayCard({ session }: { session: OpenPlaySession }) {
    const filled = session.registrations_count ?? 0;

    return (
        <Link
            href={editOpenPlay(session)}
            className="hover:border-primary/50 block rounded-lg border p-3 transition-colors"
        >
            <p className="text-muted-foreground text-xs font-medium">
                {session.starts_at ? format(parseISO(session.starts_at), 'MMM d') : '—'}
            </p>
            <p className="text-sm font-semibold">{session.title}</p>
            <p className="text-muted-foreground mt-0.5 text-xs">
                {formatTime(session.starts_at)}
                {session.ends_at ? `–${formatTime(session.ends_at)}` : ''}
            </p>
            <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                    {filled}
                    {session.max_players ? `/${session.max_players}` : ''} players
                </span>
                {session.price_per_player != null && (
                    <span className="font-medium">{formatCurrency(session.price_per_player)}</span>
                )}
            </div>
        </Link>
    );
}

function AnnouncementItem({ announcement }: { announcement: Announcement }) {
    return (
        <li className="flex items-start gap-2 text-sm">
            <span className="bg-muted-foreground mt-1.5 size-1 shrink-0 rounded-full" />
            <span className="line-clamp-1">{announcement.title}</span>
        </li>
    );
}

Dashboard.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: dashboard() }],
};
