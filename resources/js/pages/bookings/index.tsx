import { Head, Link, router } from '@inertiajs/react';
import { type ColumnDef } from '@tanstack/react-table';
import { Calendar, Eye, Plus, X } from 'lucide-react';
import { useCallback } from 'react';

import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { formatCurrency, formatDateTime } from '@/lib/format';
import {
    calendar as bookingsCalendar,
    create,
    index as bookingsIndex,
    show,
} from '@/routes/bookings';
import type { Resource, ResourceBooking, Paginated } from '@/types/booking';

type BookingFilters = {
    search?: string;
    status?: string;
    payment_status?: string;
    resource_id?: string;
    date?: string;
};

type Props = {
    bookings: Paginated<ResourceBooking>;
    canManage?: boolean;
    filters?: BookingFilters;
    resources?: Pick<Resource, 'id' | 'name'>[];
};

export default function BookingsIndex({
    bookings,
    canManage = false,
    filters = {},
    resources = [],
}: Props) {
    const applyFilters = useCallback(
        (next: Partial<BookingFilters>) => {
            router.get(
                bookingsIndex().url,
                {
                    ...filters,
                    ...next,
                },
                { preserveState: true, replace: true },
            );
        },
        [filters],
    );

    const today = () => {
        const now = new Date();
        const offset = now.getTimezoneOffset();
        return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
    };

    const hasActiveFilters = Boolean(
        filters.search ||
            filters.status ||
            filters.payment_status ||
            filters.resource_id ||
            filters.date,
    );

    const clearFilters = () => {
        router.get(
            bookingsIndex().url,
            {},
            { preserveState: true, replace: true },
        );
    };

    const columns: ColumnDef<ResourceBooking>[] = [
        {
            accessorKey: 'resource',
            header: 'Court',
            cell: ({ row }) => row.original.resource?.name ?? '—',
        },
        ...(canManage
            ? [
                  {
                      accessorKey: 'user',
                      header: 'Booked by',
                      cell: ({ row }) => (
                          <span className="flex items-center gap-2">
                              {row.original.user?.name ?? '—'}
                              {row.original.created_by &&
                                  row.original.created_by !== row.original.user_id && (
                                      <span className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                                          Walk-in
                                      </span>
                                  )}
                          </span>
                      ),
                  } as ColumnDef<ResourceBooking>,
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
                  } as ColumnDef<ResourceBooking>,
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
                        <div className="flex flex-wrap gap-2">
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
                    searchPlaceholder="Search by booked by..."
                    searchValue={filters.search}
                    onSearch={(value) => applyFilters({ search: value || undefined })}
                    filters={
                        <div className="flex flex-wrap items-center gap-2">
                            <Select
                                value={filters.status ?? 'all'}
                                onValueChange={(value) =>
                                    applyFilters({
                                        status: value === 'all' ? undefined : value,
                                    })
                                }
                            >
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All statuses</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select
                                value={filters.payment_status ?? 'all'}
                                onValueChange={(value) =>
                                    applyFilters({
                                        payment_status:
                                            value === 'all' ? undefined : value,
                                    })
                                }
                            >
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Payment" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All payments</SelectItem>
                                    <SelectItem value="unpaid">Unpaid</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="paid">Paid</SelectItem>
                                    <SelectItem value="refunded">Refunded</SelectItem>
                                    <SelectItem value="failed">Failed</SelectItem>
                                </SelectContent>
                            </Select>
                            {canManage && resources.length > 0 && (
                                <Select
                                    value={
                                        filters.resource_id
                                            ? String(filters.resource_id)
                                            : 'all'
                                    }
                                    onValueChange={(value) =>
                                        applyFilters({
                                            resource_id:
                                                value === 'all' ? undefined : value,
                                        })
                                    }
                                >
                                    <SelectTrigger className="w-[170px]">
                                        <SelectValue placeholder="Court" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All courts</SelectItem>
                                        {resources.map((resource) => (
                                            <SelectItem
                                                key={resource.id}
                                                value={String(resource.id)}
                                            >
                                                {resource.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                            <Input
                                type="date"
                                value={filters.date ?? ''}
                                onChange={(event) =>
                                    applyFilters({ date: event.target.value || undefined })
                                }
                                className="w-[150px]"
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => applyFilters({ date: today() })}
                            >
                                Today
                            </Button>
                            {hasActiveFilters && (
                                <Button variant="ghost" size="sm" onClick={clearFilters}>
                                    <X className="size-4" />
                                    Clear
                                </Button>
                            )}
                        </div>
                    }
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
