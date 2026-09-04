import { Head, Link } from '@inertiajs/react';
import { type ColumnDef } from '@tanstack/react-table';
import {
    CircleCheck,
    CircleDollarSign,
    LayoutGrid,
    MapPin,
    Pencil,
    Plus,
    Target,
} from 'lucide-react';

import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { StatusBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { create, edit, index as resourcesIndex } from '@/routes/resources';
import type { Paginated, Resource } from '@/types/booking';

type ResourceStats = {
    total: number;
    pickleball: number;
    billiards: number;
    available: number;
    min_rate: number;
};

type Props = {
    resources: Paginated<Resource>;
    stats?: ResourceStats | null;
};

const SPORT_STYLES: Record<string, { chip: string; badge: string }> = {
    pickleball: {
        chip: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        badge: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-400',
    },
    billiards: {
        chip: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
        badge: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-400',
    },
};

export default function ResourcesIndex({ resources, stats = null }: Props) {
    const columns: ColumnDef<Resource>[] = [
        {
            accessorKey: 'name',
            header: 'Resource',
            cell: ({ row }) => {
                const style =
                    SPORT_STYLES[row.original.sport] ?? SPORT_STYLES.pickleball;

                return (
                    <div className="flex items-center gap-3">
                        <div
                            className={cn(
                                'flex size-9 shrink-0 items-center justify-center rounded-lg',
                                style.chip,
                            )}
                        >
                            <LayoutGrid className="size-4" />
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
            header: 'Sport',
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
                    {row.original.sport}
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
            header: 'Location',
            cell: ({ row }) => (
                <span className="capitalize">
                    {row.original.location_type ?? '—'}
                </span>
            ),
        },
        {
            accessorKey: 'hourly_rate',
            header: 'Rate',
            cell: ({ row }) => (
                <span className="font-medium tabular-nums">
                    {formatCurrency(row.original.hourly_rate)}
                </span>
            ),
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
        },
        {
            id: 'actions',
            header: '',
            cell: ({ row }) => (
                <div className="flex justify-end">
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
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <StatCard
                            label="Total resources"
                            value={stats.total}
                            caption="Courts and tables"
                            icon={LayoutGrid}
                            tone="brand"
                        />
                        <StatCard
                            label="Pickleball"
                            value={stats.pickleball}
                            caption={
                                stats.pickleball === 1 ? 'Court' : 'Courts'
                            }
                            icon={Target}
                            tone="emerald"
                        />
                        <StatCard
                            label="Billiards"
                            value={stats.billiards}
                            caption={stats.billiards === 1 ? 'Table' : 'Tables'}
                            icon={CircleDollarSign}
                            tone="blue"
                        />
                        <StatCard
                            label="Available now"
                            value={stats.available}
                            caption={
                                stats.available === stats.total
                                    ? 'All bookable'
                                    : `of ${stats.total} bookable`
                            }
                            icon={CircleCheck}
                            tone={
                                stats.available === stats.total
                                    ? 'emerald'
                                    : 'amber'
                            }
                        />
                    </div>
                ) : null}

                <DataTable
                    columns={columns}
                    data={resources.data}
                    pagination={resources}
                    paginationUnit="resource"
                    emptyIcon={MapPin}
                    emptyTitle="No resources configured"
                    emptyDescription="Create a court or table to start taking bookings."
                />
            </div>
        </>
    );
}

ResourcesIndex.layout = {
    breadcrumbs: [{ title: 'Resources', href: resourcesIndex() }],
};
