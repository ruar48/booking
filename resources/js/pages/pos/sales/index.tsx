import { Head, Link } from '@inertiajs/react';
import { type ColumnDef } from '@tanstack/react-table';
import { Eye, Receipt } from 'lucide-react';

import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { checkout as posCheckout } from '@/routes/pos';
import { index as salesIndex, show } from '@/routes/pos/sales';
import type { Paginated } from '@/types/booking';
import type { Sale } from '@/types/pos';

type Props = {
    sales: Paginated<Sale>;
    filters: {
        club_id?: number | null;
        status?: string | null;
    };
};

export default function SalesIndex({ sales, filters }: Props) {
    const columns: ColumnDef<Sale>[] = [
        {
            accessorKey: 'invoice_number',
            header: 'Invoice',
            cell: ({ row }) => (
                <Link href={show(row.original)} className="font-medium hover:underline">
                    {row.original.invoice_number}
                </Link>
            ),
        },
        {
            accessorKey: 'cashier',
            header: 'Cashier',
            cell: ({ row }) => row.original.cashier?.name ?? '—',
        },
        {
            accessorKey: 'total',
            header: 'Total',
            cell: ({ row }) => formatCurrency(row.original.total),
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
        },
        {
            accessorKey: 'created_at',
            header: 'Date',
            cell: ({ row }) => formatDateTime(row.original.created_at),
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
            <Head title="Sales" />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <PageHeader
                    title="Sales"
                    description="Point of sale transaction history"
                    actions={
                        <Button asChild>
                            <Link href={posCheckout()}>
                                <Receipt className="size-4" />
                                New sale
                            </Link>
                        </Button>
                    }
                />

                <DataTable
                    columns={columns}
                    data={sales.data}
                    pagination={sales}
                    emptyIcon={Receipt}
                    emptyTitle="No sales yet"
                    emptyDescription="Completed sales will appear here."
                />
            </div>
        </>
    );
}

SalesIndex.layout = {
    breadcrumbs: [{ title: 'Sales', href: salesIndex() }],
};
