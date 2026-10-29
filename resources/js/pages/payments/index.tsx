import { Head, Link, router } from '@inertiajs/react';
import { type ColumnDef } from '@tanstack/react-table';
import { AlertTriangle, CreditCard, Eye } from 'lucide-react';

import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { formatCurrency, formatDate } from '@/lib/format';
import { index as paymentsIndex, show } from '@/routes/payments';
import type { Paginated, Payment } from '@/types/booking';

type Props = {
    payments: Paginated<Payment>;
    filters: { status?: string };
    flaggedCount: number;
};

export default function PaymentsIndex({ payments, filters, flaggedCount }: Props) {
    const handleFilter = (value: string) => {
        router.get(
            paymentsIndex().url,
            { status: value === 'all' ? undefined : value },
            { preserveState: true, replace: true },
        );
    };

    const columns: ColumnDef<Payment>[] = [
        {
            accessorKey: 'id',
            header: 'ID',
            cell: ({ row }) => `#${row.original.id}`,
        },
        {
            accessorKey: 'user',
            header: 'User',
            cell: ({ row }) => row.original.user?.name ?? '—',
        },
        {
            accessorKey: 'payable_type',
            header: 'Type',
            cell: ({ row }) =>
                row.original.payable_type.split('\\').pop() ?? '—',
        },
        {
            accessorKey: 'amount',
            header: 'Amount',
            cell: ({ row }) => formatCurrency(row.original.amount),
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5">
                    <StatusBadge status={row.original.status} />
                    {row.original.flagged_at ? (
                        <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="size-3" />
                            Needs refund / review
                        </Badge>
                    ) : null}
                </div>
            ),
        },
        {
            accessorKey: 'paid_at',
            header: 'Paid',
            cell: ({ row }) => formatDate(row.original.paid_at),
        },
        {
            id: 'actions',
            header: '',
            cell: ({ row }) => (
                <Button variant="ghost" size="icon" asChild>
                    <Link href={show(row.original)}>
                        <Eye className="size-4" />
                    </Link>
                </Button>
            ),
        },
    ];

    return (
        <>
            <Head title="Payments" />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <PageHeader
                    title="Payments"
                    description="Track and manage payment records"
                />

                {flaggedCount > 0 && filters.status !== 'flagged' ? (
                    <button
                        type="button"
                        onClick={() => handleFilter('flagged')}
                        className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-left text-sm text-destructive"
                    >
                        <AlertTriangle className="size-4 shrink-0" />
                        {flaggedCount} {flaggedCount === 1 ? 'payment needs' : 'payments need'} a refund or review — show them
                    </button>
                ) : null}

                <Select
                    value={filters.status ?? 'all'}
                    onValueChange={handleFilter}
                >
                    <SelectTrigger className="w-50">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="flagged">Needs refund / review</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                </Select>

                <DataTable
                    columns={columns}
                    data={payments.data}
                    pagination={payments}
                    emptyIcon={CreditCard}
                    emptyTitle="No payments found"
                    emptyDescription="Payment records will appear here."
                />
            </div>
        </>
    );
}

PaymentsIndex.layout = {
    breadcrumbs: [{ title: 'Payments', href: paymentsIndex() }],
};
