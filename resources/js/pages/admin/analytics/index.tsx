import { Head, router } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { Eye, Monitor, Smartphone, UserCheck, Users } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { TooltipContentProps } from 'recharts';

import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { formatDateTime, formatRelative } from '@/lib/format';
import { index as analyticsIndex } from '@/routes/admin/analytics';

function getInitials(name: string): string {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');
}

type DailyPoint = { date: string; views: number; visitors: number };

type Member = {
    id: number;
    name: string;
    email: string | null;
    views: number;
    last_seen: string;
    recent_pages: { label: string; viewed_at: string }[];
};

type Analytics = {
    range: number;
    totals: {
        views: number;
        visitors: number;
        signed_in_users: number;
        guest_views: number;
        previous_views: number;
        previous_visitors: number;
    };
    daily: DailyPoint[];
    pages: { page: string; label: string; views: number; visitors: number }[];
    members: Member[];
    devices: { device: string; views: number }[];
    referrers: { host: string; views: number }[];
};

type Props = {
    analytics: Analytics;
    ranges: number[];
};

const number = new Intl.NumberFormat();

function percentChange(current: number, previous: number): number | null {
    return previous > 0 ? Math.round(((current - previous) / previous) * 100) : null;
}

function share(part: number, whole: number): string {
    return whole > 0 ? `${Math.round((part / whole) * 100)}%` : '0%';
}

export default function AnalyticsIndex({ analytics, ranges }: Props) {
    const { totals, daily, pages, members, devices, referrers, range } = analytics;
    const viewsChange = percentChange(totals.views, totals.previous_views);
    const visitorsChange = percentChange(totals.visitors, totals.previous_visitors);
    const topPageViews = pages[0]?.views ?? 0;
    const hasData = totals.views > 0;

    const changeRange = (value: string) => {
        if (!value) {
            return;
        }

        router.get(analyticsIndex().url, { range: value }, { preserveScroll: true, preserveState: true });
    };

    return (
        <>
            <Head title="Analytics" />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <PageHeader
                    title="Analytics"
                    description="Who's visiting the website. Staff and admin visits aren't counted."
                    actions={
                        <ToggleGroup
                            type="single"
                            variant="outline"
                            size="sm"
                            value={String(range)}
                            onValueChange={changeRange}
                            aria-label="Date range"
                        >
                            {ranges.map((days) => (
                                <ToggleGroupItem key={days} value={String(days)} className="px-3">
                                    {days} days
                                </ToggleGroupItem>
                            ))}
                        </ToggleGroup>
                    }
                />

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        label="Page views"
                        value={number.format(totals.views)}
                        icon={Eye}
                        tone="brand"
                        caption={`Last ${range} days`}
                        trend={viewsChange !== null ? { value: viewsChange, label: 'vs previous period' } : undefined}
                    />
                    <StatCard
                        label="Visitors"
                        value={number.format(totals.visitors)}
                        icon={Users}
                        tone="blue"
                        caption="Unique per day"
                        trend={visitorsChange !== null ? { value: visitorsChange, label: 'vs previous period' } : undefined}
                    />
                    <StatCard
                        label="Signed-in members"
                        value={number.format(totals.signed_in_users)}
                        icon={UserCheck}
                        tone="violet"
                        caption="Distinct accounts"
                    />
                    <StatCard
                        label="Guest views"
                        value={share(totals.guest_views, totals.views)}
                        icon={Eye}
                        tone="amber"
                        caption={`${number.format(totals.guest_views)} views while logged out`}
                    />
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Page views per day</CardTitle>
                        <CardDescription>Hover a day to see its visitors</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {hasData ? (
                            <ResponsiveContainer width="100%" height={260}>
                                <AreaChart data={daily} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="views-fill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.25} />
                                            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 12 }}
                                        tickLine={false}
                                        axisLine={false}
                                        interval="preserveStartEnd"
                                        minTickGap={24}
                                        tickFormatter={(value) => format(parseISO(String(value)), 'MMM d')}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 12 }}
                                        tickLine={false}
                                        axisLine={false}
                                        allowDecimals={false}
                                        width={40}
                                    />
                                    <Tooltip
                                        cursor={{ stroke: 'var(--color-border)' }}
                                        content={(props) => <DailyTooltip {...props} />}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="views"
                                        name="Page views"
                                        stroke="var(--color-primary)"
                                        strokeWidth={2}
                                        fill="url(#views-fill)"
                                        activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--color-card)' }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-muted-foreground py-24 text-center text-sm">
                                No visits recorded in this period yet. Views start counting from today.
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Who visited</CardTitle>
                        <CardDescription>
                            Logged-in members, most recent first. Guests can&apos;t be named — they only count in the
                            totals.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {members.length === 0 ? (
                            <p className="text-muted-foreground py-6 text-center text-sm">
                                No logged-in members have visited in this period.
                            </p>
                        ) : (
                            <ul className="divide-y">
                                {members.map((member) => (
                                    <li key={member.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start">
                                        <div className="flex min-w-0 flex-1 items-center gap-3">
                                            <Avatar className="size-9">
                                                <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <p className="truncate font-medium">{member.name}</p>
                                                {member.email && (
                                                    <p className="text-muted-foreground truncate text-xs">
                                                        {member.email}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex-1 text-xs">
                                            <p className="text-muted-foreground mb-1">Recently viewed</p>
                                            <div className="flex flex-wrap gap-1">
                                                {member.recent_pages.map((page, index) => (
                                                    <Badge
                                                        key={`${page.viewed_at}-${index}`}
                                                        variant="secondary"
                                                        title={formatDateTime(page.viewed_at)}
                                                    >
                                                        {page.label}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="text-right text-xs sm:w-32">
                                            <p className="font-medium">{formatRelative(member.last_seen)}</p>
                                            <p className="text-muted-foreground">
                                                {number.format(member.views)} page view{member.views === 1 ? '' : 's'}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>

                <div className="grid gap-4 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Top pages</CardTitle>
                            <CardDescription>Most viewed pages in this period</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {pages.length === 0 ? (
                                <p className="text-muted-foreground py-6 text-center text-sm">No page views yet.</p>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-muted-foreground border-b text-left text-xs">
                                            <th className="pb-2 font-medium">Page</th>
                                            <th className="pb-2 text-right font-medium">Views</th>
                                            <th className="pb-2 text-right font-medium">Visitors</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pages.map((page) => (
                                            <tr key={page.page} className="border-b last:border-0">
                                                <td className="py-2 pr-4">
                                                    <p className="font-medium">{page.label}</p>
                                                    <div className="bg-muted mt-1 h-1.5 w-full overflow-hidden rounded-full">
                                                        <div
                                                            className="bg-primary h-full rounded-full"
                                                            style={{
                                                                width: `${topPageViews > 0 ? (page.views / topPageViews) * 100 : 0}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="py-2 text-right tabular-nums">
                                                    {number.format(page.views)}
                                                </td>
                                                <td className="text-muted-foreground py-2 text-right tabular-nums">
                                                    {number.format(page.visitors)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </CardContent>
                    </Card>

                    <div className="flex flex-col gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Devices</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm">
                                    {devices.length === 0 ? (
                                        <li className="text-muted-foreground">No data yet.</li>
                                    ) : (
                                        devices.map((device) => (
                                            <li key={device.device} className="flex items-center justify-between">
                                                <span className="flex items-center gap-2 capitalize">
                                                    {device.device === 'mobile' ? (
                                                        <Smartphone className="text-muted-foreground size-4" />
                                                    ) : (
                                                        <Monitor className="text-muted-foreground size-4" />
                                                    )}
                                                    {device.device}
                                                </span>
                                                <span className="tabular-nums">
                                                    {share(device.views, totals.views)}
                                                    <span className="text-muted-foreground ml-2 text-xs">
                                                        {number.format(device.views)}
                                                    </span>
                                                </span>
                                            </li>
                                        ))
                                    )}
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Where visitors came from</CardTitle>
                                <CardDescription>Other sites that linked here</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm">
                                    {referrers.length === 0 ? (
                                        <li className="text-muted-foreground">
                                            No referrals yet — visits were direct or from bookmarks.
                                        </li>
                                    ) : (
                                        referrers.map((referrer) => (
                                            <li key={referrer.host} className="flex items-center justify-between gap-2">
                                                <span className="truncate">{referrer.host}</span>
                                                <span className="tabular-nums">{number.format(referrer.views)}</span>
                                            </li>
                                        ))
                                    )}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

function DailyTooltip({ active, payload }: TooltipContentProps) {
    if (!active || !payload?.length) {
        return null;
    }

    const point = payload[0].payload as DailyPoint;

    return (
        <div className="bg-popover text-popover-foreground rounded-md border px-3 py-2 text-xs shadow-md">
            <p className="mb-1 font-medium">{format(parseISO(point.date), 'EEE, MMM d')}</p>
            <p className="tabular-nums">{number.format(point.views)} page views</p>
            <p className="text-muted-foreground tabular-nums">{number.format(point.visitors)} visitors</p>
        </div>
    );
}

AnalyticsIndex.layout = {
    breadcrumbs: [{ title: 'Analytics', href: analyticsIndex() }],
};
