import { Head, Link } from '@inertiajs/react';
import { type ColumnDef } from '@tanstack/react-table';
import { Dumbbell, Eye } from 'lucide-react';

import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { checkout as rentalsCheckout } from '@/routes/rentals';
import { index as transactionsIndex, show } from '@/routes/rentals/transactions';
import type { Paginated } from '@/types/booking';
import type { RentalTransaction } from '@/types/rentals';

type Props = {
    transactions: Paginated<RentalTransaction>;
    filters: {
        club_id?: number | null;
        status?: string | null;
    };
};

export default function RentalTransactionsIndex({ transactions }: Props) {
    const columns: ColumnDef<RentalTransaction>[] = [
        {
            accessorKey: 'reference_number',
            header: 'Reference',
            cell: ({ row }) => (
                <Link href={show(row.original)} className="font-medium hover:underline">
                    {row.original.reference_number}
                </Link>
            ),
        },
        {
            accessorKey: 'renter',
            header: 'Renter',
            cell: ({ row }) => row.original.renter?.name ?? row.original.renter_name ?? 'Walk-in',
        },
        {
            accessorKey: 'staff',
            header: 'Staff',
            cell: ({ row }) => row.original.staff?.name ?? '—',
        },
        {
            accessorKey: 'total_amount',
            header: 'Total',
            cell: ({ row }) => formatCurrency(row.original.total_amount),
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
        },
        {
            accessorKey: 'rented_at',
            header: 'Rented',
            cell: ({ row }) => formatDateTime(row.original.rented_at),
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
            <Head title="Rental Transactions" />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <PageHeader
                    title="Rental Transactions"
                    description="Track rented equipment and returns"
                    actions={
                        <Button asChild>
                            <Link href={rentalsCheckout()}>
                                <Dumbbell className="size-4" />
                                Rent out
                            </Link>
                        </Button>
                    }
                />

                <DataTable
                    columns={columns}
                    data={transactions.data}
                    pagination={transactions}
                    emptyIcon={Dumbbell}
                    emptyTitle="No rentals yet"
                    emptyDescription="Rented equipment will appear here."
                />
            </div>
        </>
    );
}

RentalTransactionsIndex.layout = {
    breadcrumbs: [{ title: 'Rental transactions', href: transactionsIndex() }],
};
