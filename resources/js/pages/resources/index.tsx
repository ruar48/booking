import { Head, Link, router } from '@inertiajs/react';
import { type ColumnDef } from '@tanstack/react-table';
import {
    ChevronsUpDown,
    CircleCheck,
    CircleDollarSign,
    CircleDot,
    Grid2x2,
    LayoutGrid,
    ListFilter,
    MapPin,
    MoreHorizontal,
    Pencil,
    Plus,
    Target,
} from 'lucide-react';
import { useCallback } from 'react';

import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { StatCard, type StatTone } from '@/components/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { formatCurrency } from '@/lib/format';
import { SPORTS, sportLabel, type SportValue } from '@/lib/sport';
import { cn } from '@/lib/utils';
import { create, edit, index as resourcesIndex } from '@/routes/resources';
import type { Paginated, Resource } from '@/types/booking';

type ResourceStats = {
    total: number;
    by_sport: Partial<Record<SportValue, number>>;
    available: number;
    min_rate: number;
};

type ResourceFilters = {
    search?: string;
    sport?: string;
    status?: string;
    sort?: string;
    direction?: string;
};

type Props = {
    resources: Paginated<Resource>;
    stats?: ResourceStats | null;
    filters?: ResourceFilters;
};

const SPORT_STYLES: Record<
    SportValue,
    { chip: string; badge: string; Icon: typeof Grid2x2; tone: StatTone }
> = {
    pickleball: {
        chip: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        badge: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-400',
        Icon: Grid2x2,
        tone: 'blue',
    },
    billiards: {
        chip: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
        badge: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-400',
        Icon: CircleDollarSign,
        tone: 'violet',
    },
    table_tennis: {
        chip: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
        badge: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/50 dark:bg-violet-950/40 dark:text-violet-400',
        Icon: CircleDot,
        tone: 'brand',
    },
    pickle_range: {
        chip: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        badge: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-400',
        Icon: Target,
        tone: 'amber',
    },
};

const STATUS_STYLES: Record<string, { dot: string; pill: string }> = {
    available: {
        dot: 'bg-emerald-500',
        pill: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-400',
    },
    maintenance: {
        dot: 'bg-amber-500',
        pill: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-400',
    },
    unavailable: {
        dot: 'bg-red-500',
        pill: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400',
    },
};

export default function ResourcesIndex({
    resources,
    stats = null,
    filters = {},
}: Props) {
    const applyFilters = useCallback(
        (next: Partial<ResourceFilters>) => {
            router.get(
                resourcesIndex().url,
                { ...filters, ...next },
                { preserveState: true, replace: true },
            );
        },
        [filters],
    );

    // Sorting runs on the server so it orders the whole table, not just the
    // rows that happen to be on this page.
    const toggleSort = (column: string) => {
        const isActive = filters.sort === column;

        applyFilters({
            sort: column,
            direction: isActive && filters.direction === 'asc' ? 'desc' : 'asc',
        });
    };

    const sortableHeader = (label: string, column: string) => (
        <button
            type="button"
            onClick={() => toggleSort(column)}
            className={cn(
                '-ml-1 flex items-center gap-1 rounded px-1 transition-colors hover:text-foreground',
                filters.sort === column && 'font-medium text-foreground',
            )}
        >
            {label}
            <ChevronsUpDown className="size-3.5 opacity-60" />
        </button>
    );

    const columns: ColumnDef<Resource>[] = [
        {
            accessorKey: 'name',
            header: () => sortableHeader('Resource', 'name'),
            cell: ({ row }) => {
                const style =
                    SPORT_STYLES[row.original.sport] ?? SPORT_STYLES.pickleball;
                const { Icon } = style;

                return (
                    <div className="flex items-center gap-3">
                        <div
                            className={cn(
                                'flex size-9 shrink-0 items-center justify-center rounded-lg',
                                style.chip,
                            )}
                        >
                            <Icon className="size-4" />
                        </div>
                        <Link
                            href={edit(row.original)}
                            className="font-medium hover:underline"
                        >
                            {row.original.name}
                        </Link>
                    </div>
                );
            },
        },
        {
            accessorKey: 'sport',
            header: () => sortableHeader('Sport', 'sport'),
            cell: ({ row }) => (
                <Badge
                    variant="outline"
                    className={cn(
                        'capitalize',
                        (
                            SPORT_STYLES[row.original.sport] ??
                            SPORT_STYLES.pickleball
                        ).badge,
                    )}
                >
                    {sportLabel(row.original.sport)}
                </Badge>
            ),
        },
        {
            accessorKey: 'surface_type',
            header: 'Surface',
            cell: ({ row }) => (
                <span className="capitalize">
                    {row.original.surface_type ?? '—'}
                </span>
            ),
        },
        {
            accessorKey: 'location_type',
            header: () => sortableHeader('Location', 'location_type'),
            cell: ({ row }) => (
                <span className="capitalize">
                    {row.original.location_type ?? '—'}
                </span>
            ),
        },
        {
            accessorKey: 'hourly_rate',
            header: () => sortableHeader('Rate', 'hourly_rate'),
            cell: ({ row }) => (
                <span className="font-medium tabular-nums">
                    {formatCurrency(row.original.hourly_rate)}
                </span>
            ),
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const style =
                    STATUS_STYLES[row.original.status] ??
                    STATUS_STYLES.unavailable;

                return (
                    <span
                        className={cn(
                            'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize',
                            style.pill,
                        )}
                    >
                        <span
                            className={cn('size-1.5 rounded-full', style.dot)}
                        />
                        {row.original.status}
                    </span>
                );
            },
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <div className="flex justify-end gap-1.5">
                    <Button
                        variant="outline"
                        size="icon"
                        asChild
                        className="size-8 text-muted-foreground hover:text-foreground"
                        title="Edit resource"
                    >
                        <Link href={edit(row.original)}>
                            <Pencil className="size-4" />
                        </Link>
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="size-8 text-muted-foreground hover:text-foreground"
                                title="More actions"
                            >
                                <MoreHorizontal className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                                <Link href={edit(row.original)}>
                                    <Pencil className="size-4" />
                                    Edit resource
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ),
        },
    ];

    return (
        <>
            <Head title="Resources" />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <PageHeader
                    title="Resources"
                    description="Manage your bookable courts and tables — rates, sport, and availability"
                    actions={
                        <Button asChild>
                            <Link href={create()}>
                                <Plus className="size-4" />
                                New resource
                            </Link>
                        </Button>
                    }
                />

                {stats ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard
                            orientation="inline"
                            label="Total resources"
                            value={stats.total}
                            caption="Total resources"
                            icon={LayoutGrid}
                            tone="emerald"
                        />
                        {SPORTS.map((sport) => {
                            const label = `${sport.label} ${sport.unit}`;

                            return (
                                <StatCard
                                    key={sport.value}
                                    orientation="inline"
                                    label={label}
                                    value={stats.by_sport[sport.value] ?? 0}
                                    caption={label}
                                    icon={SPORT_STYLES[sport.value].Icon}
                                    tone={SPORT_STYLES[sport.value].tone}
                                />
                            );
                        })}
                        <StatCard
                            orientation="inline"
                            label="Min rate"
                            value={formatCurrency(stats.min_rate)}
                            caption="Min rate"
                            icon={CircleDollarSign}
                            tone="amber"
                        />
                        <StatCard
                            orientation="inline"
                            label="Available now"
                            value={stats.available}
                            caption="Available now"
                            icon={CircleCheck}
                            tone="emerald"
                        />
                    </div>
                ) : null}

                <DataTable
                    columns={columns}
                    data={resources.data}
                    pagination={resources}
                    searchPlaceholder="Search resources..."
                    searchValue={filters.search}
                    onSearch={(value) =>
                        applyFilters({ search: value || undefined })
                    }
                    filters={
                        <div className="flex items-center gap-2 sm:ml-auto">
                            <Select
                                value={filters.sport ?? 'all'}
                                onValueChange={(value) =>
                                    applyFilters({
                                        sport:
                                            value === 'all' ? undefined : value,
                                    })
                                }
                            >
                                <SelectTrigger className="w-full sm:w-[150px]">
                                    <SelectValue placeholder="All sports" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All sports
                                    </SelectItem>
                                    {SPORTS.map((sport) => (
                                        <SelectItem
                                            key={sport.value}
                                            value={sport.value}
                                        >
                                            {sport.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select
                                value={filters.status ?? 'all'}
                                onValueChange={(value) =>
                                    applyFilters({
                                        status:
                                            value === 'all' ? undefined : value,
                                    })
                                }
                            >
                                <SelectTrigger
                                    className="w-auto shrink-0 px-2.5"
                                    title="Filter by status"
                                >
                                    <ListFilter className="size-4" />
                                </SelectTrigger>
                                <SelectContent align="end">
                                    <SelectItem value="all">
                                        All statuses
                                    </SelectItem>
                                    <SelectItem value="available">
                                        Available
                                    </SelectItem>
                                    <SelectItem value="maintenance">
                                        Maintenance
                                    </SelectItem>
                                    <SelectItem value="unavailable">
                                        Unavailable
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    }
                    emptyIcon={MapPin}
                    emptyTitle="No resources found"
                    emptyDescription="Create a court or table, or clear your filters."
                />
            </div>
        </>
    );
}

ResourcesIndex.layout = {
    breadcrumbs: [{ title: 'Resources', href: resourcesIndex() }],
};
