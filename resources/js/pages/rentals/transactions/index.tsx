import { Head, Link, router } from '@inertiajs/react';
import { type ColumnDef } from '@tanstack/react-table';
import {
    CalendarCheck,
    CalendarClock,
    Dumbbell,
    Eye,
    Package,
    PackageCheck,
    PackageSearch,
    PhilippinePeso,
    TriangleAlert,
} from 'lucide-react';
import { useState } from 'react';

import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { StatTile } from '@/components/stat-tile';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { formatCurrency } from '@/lib/format';
import {
    DueBadge,
    formatDueLabel,
    formatDurationLabel,
    formatReservedForLabel,
    getDueMeta,
    getRentalItemIcon,
} from '@/lib/rental-display';
import { checkout as rentalsCheckout } from '@/routes/rentals';
import {
    approve as approveRoute,
    index as transactionsIndex,
    returnItems as returnItemsRoute,
    show,
} from '@/routes/rentals/transactions';
import type { Paginated } from '@/types/booking';
import type { RentalTransaction } from '@/types/rentals';

type Stats = {
    active: number;
    overdue: number;
    returned: number;
    lost: number;
    reserved: number;
    revenue: number;
};

type Props = {
    transactions: Paginated<RentalTransaction>;
    stats: Stats;
    staffOptions: { id: number; name: string }[];
    filters: {
        club_id?: string | null;
        status?: string | null;
        search?: string | null;
        staff_id?: string | null;
    };
};

function EquipmentCell({ transaction }: { transaction: RentalTransaction }) {
    const items = transaction.items ?? [];

    if (items.length === 0) {
        return <span className="text-muted-foreground">—</span>;
    }

    const primary = items[0];
    const Icon = getRentalItemIcon(primary.rental_item_name);

    return (
        <div className="flex items-center gap-2">
            <Icon className="text-muted-foreground size-4 shrink-0" />
            <span>
                {primary.rental_item_name}
                {items.length > 1 && (
                    <span className="text-muted-foreground"> +{items.length - 1} more</span>
                )}
            </span>
        </div>
    );
}

export default function RentalTransactionsIndex({ transactions, stats, staffOptions, filters }: Props) {
    const [processingId, setProcessingId] = useState<number | null>(null);

    const updateFilters = (next: Record<string, string | undefined>) => {
        router.get(
            transactionsIndex().url,
            { ...filters, ...next },
            { preserveState: true, replace: true },
        );
    };

    const quickReturn = (transaction: RentalTransaction) => {
        const items = transaction.items ?? [];
        const payload = items
            .map((item) => ({
                rental_transaction_item_id: item.id,
                quantity_returned: item.quantity - item.quantity_returned,
            }))
            .filter((line) => line.quantity_returned > 0);

        if (payload.length === 0) {
            return;
        }

        router.patch(
            returnItemsRoute(transaction).url,
            { items: payload },
            {
                preserveScroll: true,
                onStart: () => setProcessingId(transaction.id),
                onFinish: () => setProcessingId(null),
            },
        );
    };

    const quickApprove = (transaction: RentalTransaction) => {
        router.post(
            approveRoute(transaction).url,
            {},
            {
                preserveScroll: true,
                onStart: () => setProcessingId(transaction.id),
                onFinish: () => setProcessingId(null),
            },
        );
    };

    const columns: ColumnDef<RentalTransaction>[] = [
        {
            accessorKey: 'reference_number',
            header: 'Reference',
            cell: ({ row }) => (
                <Link href={show(row.original)} className="font-mono text-xs font-medium hover:underline">
                    #{row.original.reference_number.split('-').pop()}
                </Link>
            ),
        },
        {
            id: 'equipment',
            header: 'Equipment',
            cell: ({ row }) => <EquipmentCell transaction={row.original} />,
        },
        {
            accessorKey: 'renter',
            header: 'Renter',
            cell: ({ row }) => row.original.renter?.name ?? row.original.renter_name ?? 'Walk-in',
        },
        {
            accessorKey: 'total_amount',
            header: 'Total',
            cell: ({ row }) => formatCurrency(row.original.total_amount),
        },
        {
            id: 'duration',
            header: 'Duration',
            cell: ({ row }) => formatDurationLabel(row.original),
        },
        {
            id: 'due',
            header: 'Due',
            cell: ({ row }) => {
                const transaction = row.original;
                const meta = getDueMeta(transaction);

                if (transaction.status === 'returned') {
                    return <DueBadge tone={meta.tone} label={meta.label} />;
                }

                if (transaction.status === 'reserved') {
                    return (
                        <div className="flex flex-col gap-1">
                            <DueBadge tone={meta.tone} label={meta.label} />
                            <span className="text-muted-foreground text-xs">
                                For {formatReservedForLabel(transaction.reserved_for)}
                            </span>
                        </div>
                    );
                }

                return (
                    <div className="flex flex-col gap-1">
                        <DueBadge tone={meta.tone} label={meta.label} />
                        <span className="text-muted-foreground text-xs">
                            {formatDueLabel(transaction.due_at)}
                        </span>
                    </div>
                );
            },
        },
        {
            id: 'actions',
            header: '',
            cell: ({ row }) => {
                const transaction = row.original;
                const canReturn = transaction.status === 'active' || transaction.status === 'overdue';
                const canApprove = transaction.status === 'reserved';

                return (
                    <div className="flex items-center justify-end gap-1">
                        {canApprove && (
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={processingId === transaction.id}
                                onClick={() => quickApprove(transaction)}
                            >
                                <CalendarCheck className="size-4" />
                                Approve
                            </Button>
                        )}
                        {canReturn && (
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={processingId === transaction.id}
                                onClick={() => quickReturn(transaction)}
                            >
                                <PackageCheck className="size-4" />
                                Return
                            </Button>
                        )}
                        <Button variant="ghost" size="icon" asChild>
                            <Link href={show(transaction)}>
                                <Eye className="size-4" />
                            </Link>
                        </Button>
                    </div>
                );
            },
        },
    ];

    return (
        <>
            <Head title="Rental Transactions" />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <PageHeader
                    title="Rental Transactions"
                    description="Manage equipment rentals and returns"
                    actions={
                        <Button asChild>
                            <Link href={rentalsCheckout()}>
                                <Dumbbell className="size-4" />
                                Rent out
                            </Link>
                        </Button>
                    }
                />

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                    <StatTile icon={PackageSearch} label="Active" value={stats.active} />
                    <StatTile
                        icon={TriangleAlert}
                        label="Overdue"
                        value={stats.overdue}
                        tone={stats.overdue > 0 ? 'red' : undefined}
                    />
                    <StatTile
                        icon={CalendarClock}
                        label="Reserved"
                        value={stats.reserved}
                        tone={stats.reserved > 0 ? 'amber' : undefined}
                    />
                    <StatTile icon={Package} label="Returned" value={stats.returned} />
                    <StatTile icon={PhilippinePeso} label="Revenue" value={formatCurrency(stats.revenue)} />
                </div>

                <DataTable
                    columns={columns}
                    data={transactions.data}
                    pagination={transactions}
                    searchPlaceholder="Search reference or renter..."
                    searchValue={filters.search ?? ''}
                    onSearch={(value) => updateFilters({ search: value || undefined })}
                    rowClassName={(transaction) => {
                        const tone = getDueMeta(transaction).tone;

                        if (tone === 'red') return 'bg-red-500/5 hover:bg-red-500/10';
                        if (transaction.status === 'reserved') return 'bg-blue-500/5 hover:bg-blue-500/10';
                        if (transaction.status === 'returned') return 'bg-muted/30';

                        return undefined;
                    }}
                    filters={
                        <div className="flex flex-wrap items-center gap-2">
                            <Select
                                value={filters.status ?? 'all'}
                                onValueChange={(value) =>
                                    updateFilters({ status: value === 'all' ? undefined : value })
                                }
                            >
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All statuses</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="overdue">Overdue</SelectItem>
                                    <SelectItem value="reserved">Reserved</SelectItem>
                                    <SelectItem value="returned">Returned</SelectItem>
                                    <SelectItem value="lost">Lost</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select
                                value={filters.staff_id ?? 'all'}
                                onValueChange={(value) =>
                                    updateFilters({ staff_id: value === 'all' ? undefined : value })
                                }
                            >
                                <SelectTrigger className="w-[160px]">
                                    <SelectValue placeholder="Staff" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All staff</SelectItem>
                                    {staffOptions.map((staff) => (
                                        <SelectItem key={staff.id} value={String(staff.id)}>
                                            {staff.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    }
                    emptyIcon={Dumbbell}
                    emptyTitle="No rentals found"
                    emptyDescription="Click &quot;Rent out&quot; to create the first rental."
                />
            </div>
        </>
    );
}

RentalTransactionsIndex.layout = {
    breadcrumbs: [{ title: 'Rental transactions', href: transactionsIndex() }],
};
