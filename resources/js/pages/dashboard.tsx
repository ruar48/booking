import { Head, Link } from '@inertiajs/react';
import { Calendar, DollarSign, MapPin, Megaphone, Users } from 'lucide-react';
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { StatusBadge } from '@/components/status-badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    formatCurrency,
    formatDateTime,
    monthLabel,
} from '@/lib/format';
import { dashboard } from '@/routes';
import { show as showBooking } from '@/routes/bookings';
import type {
    Announcement,
    DashboardData,
    Resource,
    ResourceBooking,
} from '@/types/booking';

type Props = {
    data: DashboardData;
};

export default function Dashboard({ data }: Props) {
    const {
        stats,
        resourceAvailability = [],
        revenueChart = [],
        recentBookings,
        announcements,
    } = data;

    const revenueData = revenueChart.map((point) => ({
        label: monthLabel(point.year, point.month),
        total: point.total,
    }));

    return (
        <>
            <Head title="Dashboard" />

            <div className="flex flex-1 flex-col gap-6 p-4">
                <PageHeader
                    title="Dashboard"
                    description="Your 2-court pickleball venue at a glance"
                />

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        label="Members"
                        value={stats.active_players ?? stats.players}
                        icon={Users}
                    />
                    <StatCard label="Courts" value={stats.courts} icon={MapPin} />
                    <StatCard
                        label="Bookings Today"
                        value={stats.bookings_today}
                        icon={Calendar}
                    />
                    <StatCard
                        label="Revenue This Month"
                        value={formatCurrency(stats.revenue_this_month)}
                        icon={DollarSign}
                    />
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Revenue</CardTitle>
                            <CardDescription>Monthly booking income</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {revenueData.length ? (
                                <ResponsiveContainer width="100%" height={260}>
                                    <LineChart data={revenueData}>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                                        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                                        <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
                                        <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-muted-foreground py-16 text-center text-sm">No revenue data yet</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Court status</CardTitle>
                            <CardDescription>Court 1 & Court 2 today</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {resourceAvailability.length ? (
                                <ul className="space-y-4">
                                    {resourceAvailability.map((resource) => (
                                        <ResourceRow key={resource.id} resource={resource} />
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-muted-foreground text-sm">No courts configured</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
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
                                <ul className="divide-y">
                                    {recentBookings.map((booking) => (
                                        <BookingRow key={booking.id} booking={booking} />
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-muted-foreground text-sm">No bookings yet</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Megaphone className="size-4" />
                                Announcements
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {announcements?.length ? (
                                <ul className="space-y-4">
                                    {announcements.map((item) => (
                                        <li key={item.id}>
                                            <p className="text-sm font-medium">{item.title}</p>
                                            <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                                                {item.content}
                                            </p>
                                        </li>
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

function ResourceRow({ resource }: { resource: Resource }) {
    const todayBookings = resource.bookings?.length ?? 0;

    return (
        <li className="flex items-center justify-between gap-3">
            <div>
                <p className="font-medium">{resource.name}</p>
                <p className="text-muted-foreground text-xs">
                    {formatCurrency(resource.hourly_rate)}/hr · {todayBookings} booking
                    {todayBookings !== 1 ? 's' : ''} today
                </p>
            </div>
            <StatusBadge status={resource.status} />
        </li>
    );
}

function BookingRow({ booking }: { booking: ResourceBooking }) {
    return (
        <li className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <Link href={showBooking(booking)} className="text-sm font-medium hover:underline">
                    {booking.resource?.name ?? 'Court'} · {booking.user?.name ?? 'Guest'}
                </Link>
                <p className="text-muted-foreground text-xs">
                    {booking.starts_at ? formatDateTime(booking.starts_at) : '—'}
                </p>
            </div>
            <StatusBadge status={booking.status} />
        </li>
    );
}

Dashboard.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: dashboard() }],
};
