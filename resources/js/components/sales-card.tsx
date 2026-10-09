import { TrendingDown, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { TooltipContentProps } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { RevenueBucket, RevenueGranularity, RevenueSeries, RevenueSource } from '@/types/booking';

/** Fixed order = stacking order (bottom up) and legend order. */
const SOURCES: { key: RevenueSource; label: string; color: string }[] = [
    { key: 'bookings', label: 'Court bookings', color: 'var(--sales-bookings)' },
    { key: 'pos', label: 'POS sales', color: 'var(--sales-pos)' },
    { key: 'rentals', label: 'Rentals', color: 'var(--sales-rentals)' },
    { key: 'open_play', label: 'Open play', color: 'var(--sales-open-play)' },
];

const VIEWS: Record<RevenueGranularity, { tab: string; current: string; previous: string; span: string }> = {
    day: { tab: 'Daily', current: 'Today', previous: 'vs yesterday', span: 'Last 14 days' },
    week: { tab: 'Weekly', current: 'This week', previous: 'vs last week', span: 'Last 12 weeks' },
    month: { tab: 'Monthly', current: 'This month', previous: 'vs last month', span: 'Last 12 months' },
};

const compactCurrency = (value: number) => formatCurrency(value).replace(/\.00$/, '');

export function SalesCard({ sales }: { sales: Record<RevenueGranularity, RevenueSeries> }) {
    const [view, setView] = useState<RevenueGranularity>('day');
    const series = sales[view];
    const { current, previous_total: previousTotal } = series;
    const change = previousTotal > 0 ? Math.round(((current.total - previousTotal) / previousTotal) * 100) : null;
    const hasData = series.buckets.some((bucket) => bucket.total > 0);

    return (
        <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <CardTitle>Sales</CardTitle>
                    <CardDescription>
                        Court bookings, POS, rentals and open play · {VIEWS[view].span}
                    </CardDescription>
                </div>
                <ToggleGroup
                    type="single"
                    variant="outline"
                    size="sm"
                    value={view}
                    onValueChange={(value) => value && setView(value as RevenueGranularity)}
                    aria-label="Sales period"
                >
                    {(Object.keys(VIEWS) as RevenueGranularity[]).map((key) => (
                        <ToggleGroupItem key={key} value={key} className="px-3">
                            {VIEWS[key].tab}
                        </ToggleGroupItem>
                    ))}
                </ToggleGroup>
            </CardHeader>

            <CardContent className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    {hasData ? (
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={series.buckets} barCategoryGap="20%">
                                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                                <XAxis
                                    dataKey="label"
                                    tick={{ fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={false}
                                    interval="preserveStartEnd"
                                    minTickGap={16}
                                />
                                <YAxis
                                    tick={{ fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(v) => compactCurrency(Number(v))}
                                    width={64}
                                />
                                <Tooltip
                                    cursor={{ fill: 'var(--color-muted)', opacity: 0.5 }}
                                    content={(props) => <SalesTooltip {...props} />}
                                />
                                {SOURCES.map((source, index) => (
                                    <Bar
                                        key={source.key}
                                        dataKey={source.key}
                                        name={source.label}
                                        stackId="sales"
                                        fill={source.color}
                                        // A 2px card-coloured seam between stacked segments.
                                        stroke="var(--color-card)"
                                        strokeWidth={2}
                                        radius={index === SOURCES.length - 1 ? [4, 4, 0, 0] : 0}
                                        maxBarSize={40}
                                    />
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-muted-foreground py-24 text-center text-sm">
                            No sales recorded in this period yet
                        </p>
                    )}
                </div>

                {/* Headline + per-source breakdown. Doubles as the legend and as
                    the text view of the current period, so no figure relies on
                    bar colour alone. */}
                <div className="space-y-4">
                    <div>
                        <p className="text-muted-foreground text-xs">{VIEWS[view].current}</p>
                        <p className="text-3xl font-semibold tracking-tight tabular-nums">
                            {formatCurrency(current.total)}
                        </p>
                        <Trend change={change} label={VIEWS[view].previous} previous={previousTotal} />
                    </div>

                    <ul className="divide-y rounded-md border">
                        {SOURCES.map((source) => {
                            const amount = current[source.key];
                            const share = current.total > 0 ? Math.round((amount / current.total) * 100) : 0;

                            return (
                                <li key={source.key} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                                    <span className="flex items-center gap-2">
                                        <span
                                            className="size-2.5 shrink-0 rounded-sm"
                                            style={{ backgroundColor: source.color }}
                                            aria-hidden
                                        />
                                        {source.label}
                                    </span>
                                    <span className="text-right tabular-nums">
                                        <span className="font-medium">{formatCurrency(amount)}</span>
                                        <span className="text-muted-foreground ml-2 inline-block w-9 text-xs">
                                            {share}%
                                        </span>
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
}

function Trend({ change, label, previous }: { change: number | null; label: string; previous: number }) {
    if (change === null) {
        return (
            <p className="text-muted-foreground mt-1 text-xs">
                {label}: {formatCurrency(previous)}
            </p>
        );
    }

    const up = change >= 0;

    return (
        <p
            className={cn(
                'mt-1 inline-flex items-center gap-1 text-xs',
                up ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
            )}
        >
            {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
            {up ? '+' : ''}
            {change}% {label}
        </p>
    );
}

function SalesTooltip({ active, payload }: TooltipContentProps) {
    if (!active || !payload?.length) {
        return null;
    }

    const bucket = payload[0].payload as RevenueBucket;

    return (
        <div className="bg-popover text-popover-foreground min-w-48 rounded-lg border p-3 text-xs shadow-md">
            <p className="mb-2 font-medium">{bucket.label}</p>
            <ul className="space-y-1">
                {SOURCES.map((source) => (
                    <li key={source.key} className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                            <span className="size-2 rounded-sm" style={{ backgroundColor: source.color }} aria-hidden />
                            {source.label}
                        </span>
                        <span className="tabular-nums">{formatCurrency(bucket[source.key])}</span>
                    </li>
                ))}
            </ul>
            <div className="mt-2 flex justify-between border-t pt-2 font-medium">
                <span>Total</span>
                <span className="tabular-nums">{formatCurrency(bucket.total)}</span>
            </div>
        </div>
    );
}
