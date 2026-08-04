import { Head, Link } from '@inertiajs/react';
import { type ColumnDef } from '@tanstack/react-table';
import { MapPin, Pencil, Plus } from 'lucide-react';

import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/format';
import { create, edit, index as resourcesIndex } from '@/routes/resources';
import type { Paginated, Resource } from '@/types/booking';

type Props = {
    resources: Paginated<Resource>;
};

export default function ResourcesIndex({ resources }: Props) {
    const columns: ColumnDef<Resource>[] = [
        {
            accessorKey: 'name',
            header: 'Resource',
            cell: ({ row }) => (
                <Link href={edit(row.original)} className="font-medium hover:underline">
                    {row.original.name}
                </Link>
            ),
        },
        {
            accessorKey: 'sport',
            header: 'Sport',
            cell: ({ row }) => (
                <Badge variant="outline" className="capitalize">
                    {row.original.sport}
                </Badge>
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
                <DataTable
                    columns={columns}
                    data={resources.data}
                    pagination={resources}
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
