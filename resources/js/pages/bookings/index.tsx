import { Head, Link } from '@inertiajs/react';
import { type ColumnDef } from '@tanstack/react-table';
import { Calendar, Eye, Plus } from 'lucide-react';

import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDateTime } from '@/lib/format';
import {
    calendar as bookingsCalendar,
    create,
    index as bookingsIndex,
    show,
} from '@/routes/bookings';
import type { CourtBooking, Paginated } from '@/types/booking';

type Props = {
    bookings: Paginated<CourtBooking>;
    canManage?: boolean;
};

export default function BookingsIndex({ bookings, canManage = false }: Props) {
    const columns: ColumnDef<CourtBooking>[] = [
        {
            accessorKey: 'court',
            header: 'Court',
            cell: ({ row }) => row.original.court?.name ?? '—',
        },
        ...(canManage
            ? [
                  {
                      accessorKey: 'user',
                      header: 'Booked by',
                      cell: ({ row }) => row.original.user?.name ?? '—',
                  } as ColumnDef<CourtBooking>,
              ]
            : []),
        {
            accessorKey: 'starts_at',
            header: 'Start',
            cell: ({ row }) => formatDateTime(row.original.starts_at),
        },
        {
            accessorKey: 'ends_at',
            header: 'End',
            cell: ({ row }) => formatDateTime(row.original.ends_at),
        },
        {
            accessorKey: 'amount',
            header: 'Amount',
            cell: ({ row }) =>
                row.original.amount != null
                    ? formatCurrency(row.original.amount)
                    : '—',
        },
        {
            accessorKey: 'payment_status',
            header: 'Payment',
            cell: ({ row }) => (
                <StatusBadge status={row.original.payment_status ?? 'unpaid'} />
            ),
        },
        ...(canManage
            ? [
                  {
                      accessorKey: 'status',
                      header: 'Status',
                      cell: ({ row }) => (
                          <StatusBadge status={row.original.status} />
                      ),
                  } as ColumnDef<CourtBooking>,
              ]
            : []),
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
            <Head title={canManage ? 'Bookings' : 'My bookings'} />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <PageHeader
                    title={canManage ? 'Bookings' : 'My bookings'}
                    description={
                        canManage
                            ? 'View and manage court reservations'
                            : 'Your court reservations at Galaang-Ramos Pickleball'
                    }
                    actions={
                        <div className="flex gap-2">
                            {canManage && (
                                <Button variant="outline" asChild>
                                    <Link href={bookingsCalendar()}>
                                        <Calendar className="size-4" />
                                        Calendar
                                    </Link>
                                </Button>
                            )}
                            <Button asChild>
                                <Link href={create()}>
                                    <Plus className="size-4" />
                                    Book a court
                                </Link>
                            </Button>
                        </div>
                    }
                />
                <DataTable
                    columns={columns}
                    data={bookings.data}
                    pagination={bookings}
                    emptyIcon={Calendar}
                    emptyTitle="No bookings yet"
                    emptyDescription="Create a booking to reserve a court."
                />
            </div>
        </>
    );
}

BookingsIndex.layout = {
    breadcrumbs: [{ title: 'My bookings', href: bookingsIndex() }],
};
