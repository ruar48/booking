import { Head, Link } from '@inertiajs/react';
import { type ColumnDef } from '@tanstack/react-table';
import { MapPin, Pencil } from 'lucide-react';

import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/format';
import { edit, index as courtsIndex } from '@/routes/courts';
import type { Court, Paginated } from '@/types/booking';

type Props = {
    courts: Paginated<Court>;
};

export default function CourtsIndex({ courts }: Props) {
    const columns: ColumnDef<Court>[] = [
        {
            accessorKey: 'name',
            header: 'Court',
            cell: ({ row }) => (
                <Link href={edit(row.original)} className="font-medium hover:underline">
                    {row.original.name}
                </Link>
            ),
        },
        {
            accessorKey: 'surface_type',
            header: 'Surface',
            cell: ({ row }) => <span className="capitalize">{row.original.surface_type}</span>,
        },
        {
            accessorKey: 'location_type',
            header: 'Location',
            cell: ({ row }) => <span className="capitalize">{row.original.location_type}</span>,
        },
        {
            accessorKey: 'hourly_rate',
            header: 'Rate',
            cell: ({ row }) => formatCurrency(row.original.hourly_rate),
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
                <Button variant="ghost" size="icon" asChild>
                    <Link href={edit(row.original)}>
                        <Pencil className="size-4" />
                    </Link>
                </Button>
            ),
        },
    ];

    return (
        <>
            <Head title="Courts" />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <PageHeader
                    title="Courts"
                    description="Manage your 2 pickleball courts — rates, surface, and availability"
                />
                <DataTable
                    columns={columns}
                    data={courts.data}
                    pagination={courts}
                    emptyIcon={MapPin}
                    emptyTitle="No courts configured"
                    emptyDescription="Contact support to set up your courts."
                />
            </div>
        </>
    );
}

CourtsIndex.layout = {
    breadcrumbs: [{ title: 'Courts', href: courtsIndex() }],
};
