import { Head, router } from '@inertiajs/react';
import {
    endOfMonth,
    endOfWeek,
    format,
    parseISO,
    startOfMonth,
    startOfWeek,
    subDays,
} from 'date-fns';
import {
    Activity,
    AlertTriangle,
    Download,
    DollarSign,
    Package,
    Receipt,
    ShoppingBag,
    Wallet,
} from 'lucide-react';
import { Fragment, useMemo } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { StatusBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDate, formatRelative } from '@/lib/format';
import { index as rentalItemsIndex } from '@/routes/rental-items';
import rentals from '@/routes/rentals';

type Kpi = {
    value: number;
    trend_pct?: number | null;
};

type RevenueByDay = { date: string; revenue: number };
type RentalsByDay = { date: string; count: number };
type EquipmentRevenue = {
    rental_item_id: number;
    rental_item_name: string;
    quantity_rented: number;
    revenue: number;
};
type HeatmapCell = { day_of_week: number; hour: number; count: number };
type InventoryAlert = {
    id: number;
    name: string;
    available_quantity: number;
    total_quantity: number;
    status: 'out' | 'low';
};
type RecentRental = {
    id: number;
    reference_number: string;
    renter_name: string;
    item_summary: string;
    total_amount: number;
    rented_at: string | null;
    status: string;
};

type RentalsRevenueReport = {
    kpis: {
        revenue: Kpi;
        rentals_count: Kpi;
        avg_rental: Kpi;
        active_rentals: Kpi;
    };
    revenue_by_day: RevenueByDay[];
    rentals_by_day: RentalsByDay[];
    equipment_revenue: EquipmentRevenue[];
    heatmap: HeatmapCell[];
    inventory_alerts: InventoryAlert[];
    recent_rentals: RecentRental[];
};

type Props = {
    report: RentalsRevenueReport;
    filters: {
        start: string;
        end: string;
    };
};

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HEATMAP_HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7am – 9pm

const DONUT_COLORS = [
    'var(--chart-1)',
    'var(--chart-2)',
    'var(--chart-3)',
    'var(--color-muted-foreground)',
];

function datePreset(preset: string): { start: string; end: string } {
    const now = new Date();

    switch (preset) {
        case 'this_week':
            return {
                start: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
                end: format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
            };
        case 'last_7_days':
            return {
                start: format(subDays(now, 6), 'yyyy-MM-dd'),
                end: format(now, 'yyyy-MM-dd'),
            };
        case 'this_month':
            return {
                start: format(startOfMonth(now), 'yyyy-MM-dd'),
                end: format(endOfMonth(now), 'yyyy-MM-dd'),
            };
        case 'last_30_days':
        default:
            return {
                start: format(subDays(now, 29), 'yyyy-MM-dd'),
                end: format(now, 'yyyy-MM-dd'),
            };
    }
}

export default function RentalsReport({ report: data, filters }: Props) {
    const revenueTrend = useMemo(
        () =>
            data.revenue_by_day.map((point) => ({
                label: format(parseISO(point.date), 'MMM d'),
                revenue: point.revenue,
            })),
        [data.revenue_by_day],
    );

    const rentalsTrend = useMemo(
        () =>
            data.rentals_by_day.map((point) => ({
                label: format(parseISO(point.date), 'MMM d'),
                count: point.count,
            })),
        [data.rentals_by_day],
    );

    const equipmentBars = useMemo(
        () =>
            [...data.equipment_revenue]
                .sort((a, b) => a.revenue - b.revenue)
                .slice(-8),
        [data.equipment_revenue],
    );

    const donutData = useMemo(() => {
        const sorted = [...data.equipment_revenue].sort((a, b) => b.revenue - a.revenue);
        const top = sorted.slice(0, 3);
        const rest = sorted.slice(3);
        const otherTotal = rest.reduce((sum, item) => sum + item.revenue, 0);

        const slices = top.map((item) => ({
            name: item.rental_item_name,
            value: item.revenue,
        }));

        if (otherTotal > 0) {
            slices.push({ name: 'Other', value: otherTotal });
        }

        return slices;
    }, [data.equipment_revenue]);

    const donutTotal = donutData.reduce((sum, s) => sum + s.value, 0);

    const heatmapMax = Math.max(1, ...data.heatmap.map((cell) => cell.count));
    const heatmapLookup = useMemo(() => {
        const lookup = new Map<string, number>();
        data.heatmap.forEach((cell) => lookup.set(`${cell.day_of_week}-${cell.hour}`, cell.count));
        return lookup;
    }, [data.heatmap]);

    const handlePresetChange = (preset: string) => {
        const range = datePreset(preset);
        router.get(rentals.report().url, range, { preserveState: true });
    };

    return (
        <>
            <Head title="Rentals Report" />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <PageHeader
                    title="Rentals Report"
                    description={`${formatDate(filters.start)} – ${formatDate(filters.end)}`}
                    actions={
                        <>
                            <Select defaultValue="last_30_days" onValueChange={handlePresetChange}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="This Week" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="this_week">This Week</SelectItem>
                                    <SelectItem value="last_7_days">Last 7 days</SelectItem>
                                    <SelectItem value="last_30_days">Last 30 days</SelectItem>
                                    <SelectItem value="this_month">This Month</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button variant="outline" asChild>
                                <a
                                    href={
                                        rentals.report.export({
                                            query: { start: filters.start, end: filters.end },
                                        }).url
                                    }
                                >
                                    <Download className="size-4" />
                                    Export PDF
                                </a>
                            </Button>
                        </>
                    }
                />

                {/* KPI row */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        label="Revenue"
                        value={formatCurrency(data.kpis.revenue.value)}
                        icon={DollarSign}
                        iconClassName="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        trend={
                            data.kpis.revenue.trend_pct != null
                                ? { value: data.kpis.revenue.trend_pct, label: 'vs last period' }
                                : undefined
                        }
                    />
                    <StatCard
                        label="Rentals"
                        value={data.kpis.rentals_count.value}
                        icon={ShoppingBag}
                        iconClassName="bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        trend={
                            data.kpis.rentals_count.trend_pct != null
                                ? { value: data.kpis.rentals_count.trend_pct, label: 'vs last period' }
                                : undefined
                        }
                    />
                    <StatCard
                        label="Avg Rental"
                        value={formatCurrency(data.kpis.avg_rental.value)}
                        icon={Wallet}
                        iconClassName="bg-violet-500/10 text-violet-600 dark:text-violet-400"
                        trend={
                            data.kpis.avg_rental.trend_pct != null
                                ? { value: data.kpis.avg_rental.trend_pct, label: 'vs last period' }
                                : undefined
                        }
                    />
                    <StatCard
                        label="Active Rentals"
                        value={data.kpis.active_rentals.value}
                        icon={Activity}
                        iconClassName="bg-orange-500/10 text-orange-600 dark:text-orange-400"
                    />
                </div>

                {/* Revenue trend */}
                <Card>
                    <CardHeader>
                        <CardTitle>Revenue trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {revenueTrend.length === 0 ? (
                            <p className="text-muted-foreground py-16 text-center text-sm">
                                No rentals in this period.
                            </p>
                        ) : (
                            <ResponsiveContainer width="100%" height={280}>
                                <AreaChart data={revenueTrend}>
                                    <defs>
                                        <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.35} />
                                            <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                                    <XAxis
                                        dataKey="label"
                                        tick={{ fontSize: 12 }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 12 }}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(v) => formatCurrency(Number(v))}
                                        width={70}
                                    />
                                    <Tooltip
                                        formatter={(value) => formatCurrency(Number(value ?? 0))}
                                        contentStyle={{
                                            backgroundColor: 'var(--color-popover)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: 8,
                                            fontSize: 12,
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="var(--chart-2)"
                                        strokeWidth={2}
                                        fill="url(#revenueFill)"
                                        dot={{ r: 3, fill: 'var(--chart-2)', strokeWidth: 0 }}
                                        activeDot={{ r: 5 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Equipment revenue + distribution */}
                <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Revenue by equipment</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {equipmentBars.length === 0 ? (
                                <p className="text-muted-foreground py-16 text-center text-sm">
                                    No equipment activity.
                                </p>
                            ) : (
                                <ResponsiveContainer
                                    width="100%"
                                    height={Math.max(180, equipmentBars.length * 40)}
                                >
                                    <BarChart data={equipmentBars} layout="vertical" margin={{ left: 8 }}>
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            horizontal={false}
                                            className="stroke-border"
                                        />
                                        <XAxis
                                            type="number"
                                            tick={{ fontSize: 12 }}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(v) => formatCurrency(Number(v))}
                                        />
                                        <YAxis
                                            type="category"
                                            dataKey="rental_item_name"
                                            tick={{ fontSize: 12 }}
                                            tickLine={false}
                                            axisLine={false}
                                            width={120}
                                        />
                                        <Tooltip
                                            formatter={(value) => formatCurrency(Number(value ?? 0))}
                                            contentStyle={{
                                                backgroundColor: 'var(--color-popover)',
                                                border: '1px solid var(--color-border)',
                                                borderRadius: 8,
                                                fontSize: 12,
                                            }}
                                        />
                                        <Bar dataKey="revenue" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Equipment distribution</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {donutData.length === 0 ? (
                                <p className="text-muted-foreground py-16 text-center text-sm">
                                    No equipment activity.
                                </p>
                            ) : (
                                <div className="flex flex-col items-center gap-4 sm:flex-row">
                                    <ResponsiveContainer width="100%" height={220} className="sm:max-w-[220px]">
                                        <PieChart>
                                            <Pie
                                                data={donutData}
                                                dataKey="value"
                                                nameKey="name"
                                                innerRadius={55}
                                                outerRadius={85}
                                                paddingAngle={2}
                                                strokeWidth={2}
                                                stroke="var(--color-card)"
                                            >
                                                {donutData.map((entry, index) => (
                                                    <Cell
                                                        key={entry.name}
                                                        fill={DONUT_COLORS[index % DONUT_COLORS.length]}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value) => formatCurrency(Number(value ?? 0))}
                                                contentStyle={{
                                                    backgroundColor: 'var(--color-popover)',
                                                    border: '1px solid var(--color-border)',
                                                    borderRadius: 8,
                                                    fontSize: 12,
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <ul className="w-full space-y-2">
                                        {donutData.map((entry, index) => (
                                            <li
                                                key={entry.name}
                                                className="flex items-center justify-between gap-2 text-sm"
                                            >
                                                <span className="flex items-center gap-2">
                                                    <span
                                                        className="size-2.5 shrink-0 rounded-full"
                                                        style={{
                                                            backgroundColor:
                                                                DONUT_COLORS[index % DONUT_COLORS.length],
                                                        }}
                                                    />
                                                    {entry.name}
                                                </span>
                                                <span className="text-muted-foreground">
                                                    {donutTotal > 0
                                                        ? Math.round((entry.value / donutTotal) * 100)
                                                        : 0}
                                                    %
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Daily rentals + heatmap */}
                <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Rentals per day</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {rentalsTrend.length === 0 ? (
                                <p className="text-muted-foreground py-16 text-center text-sm">
                                    No rentals in this period.
                                </p>
                            ) : (
                                <ResponsiveContainer width="100%" height={240}>
                                    <BarChart data={rentalsTrend}>
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            vertical={false}
                                            className="stroke-border"
                                        />
                                        <XAxis
                                            dataKey="label"
                                            tick={{ fontSize: 12 }}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 12 }}
                                            tickLine={false}
                                            axisLine={false}
                                            allowDecimals={false}
                                            width={30}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'var(--color-popover)',
                                                border: '1px solid var(--color-border)',
                                                borderRadius: 8,
                                                fontSize: 12,
                                            }}
                                        />
                                        <Bar dataKey="count" name="Rentals" fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Popular rental hours</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {data.heatmap.length === 0 ? (
                                <p className="text-muted-foreground py-16 text-center text-sm">
                                    No rental activity to map yet.
                                </p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <div
                                        className="grid min-w-max gap-1"
                                        style={{
                                            gridTemplateColumns: `2.5rem repeat(${HEATMAP_HOURS.length}, 1.25rem)`,
                                        }}
                                    >
                                        <div />
                                        {HEATMAP_HOURS.map((hour) => (
                                            <div
                                                key={hour}
                                                className="text-muted-foreground text-center text-[10px]"
                                            >
                                                {hour % 12 === 0 ? 12 : hour % 12}
                                            </div>
                                        ))}
                                        {DAY_LABELS.map((day, dayIndex) => (
                                            <Fragment key={day}>
                                                <div className="text-muted-foreground flex items-center text-[11px]">
                                                    {day}
                                                </div>
                                                {HEATMAP_HOURS.map((hour) => {
                                                    const count =
                                                        heatmapLookup.get(`${dayIndex}-${hour}`) ?? 0;
                                                    const intensity = count / heatmapMax;

                                                    return (
                                                        <div
                                                            key={`${day}-${hour}`}
                                                            title={`${day} ${hour}:00 — ${count} rental${count === 1 ? '' : 's'}`}
                                                            className="aspect-square rounded-sm"
                                                            style={{
                                                                backgroundColor:
                                                                    count === 0
                                                                        ? 'var(--color-muted)'
                                                                        : 'var(--chart-2)',
                                                                opacity: count === 0 ? 1 : 0.25 + intensity * 0.75,
                                                            }}
                                                        />
                                                    );
                                                })}
                                            </Fragment>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Bottom section */}
                <div className="grid gap-4 lg:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="size-4" />
                                Top equipment
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {data.equipment_revenue.length === 0 ? (
                                <p className="text-muted-foreground text-sm">No activity yet.</p>
                            ) : (
                                <ul className="space-y-3">
                                    {data.equipment_revenue.slice(0, 5).map((item, index) => (
                                        <li
                                            key={item.rental_item_id}
                                            className="flex items-center justify-between gap-3 border-b pb-3 last:border-0 last:pb-0"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span
                                                    className={
                                                        'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ' +
                                                        (index === 0
                                                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                                            : index === 1
                                                              ? 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400'
                                                              : index === 2
                                                                ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400'
                                                                : 'bg-muted text-muted-foreground')
                                                    }
                                                >
                                                    {index + 1}
                                                </span>
                                                <div>
                                                    <p className="text-sm font-medium">
                                                        {item.rental_item_name}
                                                    </p>
                                                    <p className="text-muted-foreground text-xs">
                                                        {item.quantity_rented} rental
                                                        {item.quantity_rented !== 1 ? 's' : ''}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-sm font-medium">
                                                {formatCurrency(item.revenue)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="size-4" />
                                Inventory alerts
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {data.inventory_alerts.length === 0 ? (
                                <p className="text-muted-foreground text-sm">
                                    All equipment is well stocked.
                                </p>
                            ) : (
                                <ul className="space-y-3">
                                    {data.inventory_alerts.map((item) => (
                                        <li
                                            key={item.id}
                                            className="flex items-center justify-between gap-3 border-b pb-3 last:border-0 last:pb-0"
                                        >
                                            <div>
                                                <p className="text-sm font-medium">{item.name}</p>
                                                <p className="text-muted-foreground text-xs">
                                                    {item.available_quantity} / {item.total_quantity}{' '}
                                                    available
                                                </p>
                                            </div>
                                            <Badge
                                                variant="outline"
                                                className={
                                                    item.status === 'out'
                                                        ? 'border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400'
                                                        : 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400'
                                                }
                                            >
                                                {item.status === 'out' ? 'Out of stock' : 'Low stock'}
                                            </Badge>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Receipt className="size-4" />
                                Recent rentals
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-0">
                            {data.recent_rentals.length === 0 ? (
                                <p className="text-muted-foreground px-6 text-sm">No rentals yet.</p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Renter</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.recent_rentals.map((rental) => (
                                            <TableRow key={rental.id}>
                                                <TableCell>
                                                    <p className="font-medium">{rental.renter_name}</p>
                                                    <p className="text-muted-foreground text-xs">
                                                        {rental.item_summary || '—'}
                                                    </p>
                                                    <p className="text-muted-foreground text-xs">
                                                        {rental.rented_at
                                                            ? formatRelative(rental.rented_at)
                                                            : '—'}
                                                    </p>
                                                </TableCell>
                                                <TableCell className="text-right align-top">
                                                    <p className="font-medium">
                                                        {formatCurrency(rental.total_amount)}
                                                    </p>
                                                    <StatusBadge
                                                        status={rental.status}
                                                        className="mt-1"
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

RentalsReport.layout = {
    breadcrumbs: [
        { title: 'Rentals', href: rentalItemsIndex() },
        { title: 'Report', href: rentalItemsIndex() },
    ],
};
