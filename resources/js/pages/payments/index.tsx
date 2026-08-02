import { Head, Link, router } from '@inertiajs/react';
import { type ColumnDef } from '@tanstack/react-table';
import { CreditCard, Eye } from 'lucide-react';

import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
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
};

export default function PaymentsIndex({ payments, filters }: Props) {
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
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
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

                <Select
                    value={filters.status ?? 'all'}
                    onValueChange={handleFilter}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
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
