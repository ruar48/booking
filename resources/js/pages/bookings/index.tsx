import { Head, Link, router } from '@inertiajs/react';
import { type ColumnDef } from '@tanstack/react-table';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import {
    Calendar,
    CalendarCheck,
    CalendarClock,
    Eye,
    Plus,
    Wallet,
    WalletCards,
    X,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import type { LucideIcon } from 'lucide-react';

import { ConfirmDialog } from '@/components/confirm-dialog';
import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import {
    calendar as bookingsCalendar,
    cancel,
    create,
    index as bookingsIndex,
    show,
} from '@/routes/bookings';
import type { BookingStats, Resource, ResourceBooking, Paginated } from '@/types/booking';

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
<<<<<<< Updated upstream
    stats?: BookingStats | null;
    nextBooking?: ResourceBooking | null;
};

const ROW_TINT: Record<string, string> = {
    pending: 'bg-amber-500/[0.04] hover:bg-amber-500/[0.07]',
    approved: 'bg-blue-500/[0.04] hover:bg-blue-500/[0.07]',
    completed: 'bg-emerald-500/[0.04] hover:bg-emerald-500/[0.07]',
    cancelled: 'bg-muted/40',
    rejected: 'bg-red-500/[0.04] hover:bg-red-500/[0.07]',
};

function scheduleLabel(booking: ResourceBooking) {
    const start = parseISO(booking.starts_at);
    const end = parseISO(booking.ends_at);
    const dayLabel = isToday(start)
        ? 'Today'
        : isTomorrow(start)
          ? 'Tomorrow'
          : format(start, 'MMM d, yyyy');

    return `${dayLabel} • ${format(start, 'h:mm a')} – ${format(end, 'h:mm a')}`;
}

=======
};

>>>>>>> Stashed changes
export default function BookingsIndex({
    bookings,
    canManage = false,
    filters = {},
    resources = [],
<<<<<<< Updated upstream
    stats = null,
    nextBooking = null,
}: Props) {
    const [cancelTarget, setCancelTarget] = useState<ResourceBooking | null>(null);
    const [cancelReason, setCancelReason] = useState('');

=======
}: Props) {
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
    const canCancelBooking = useCallback(
        (booking: ResourceBooking) =>
            canManage
                ? !['cancelled', 'completed', 'rejected'].includes(booking.status)
                : ['pending', 'approved'].includes(booking.status),
        [canManage],
    );

    const confirmCancel = () => {
        if (!cancelTarget) {
            return;
        }

        router.patch(
            cancel(cancelTarget).url,
            { cancellation_reason: cancelReason || undefined },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setCancelTarget(null);
                    setCancelReason('');
                },
            },
        );
    };

=======
>>>>>>> Stashed changes
    const columns: ColumnDef<ResourceBooking>[] = [
        {
            accessorKey: 'resource',
            header: 'Court',
            cell: ({ row }) => (
                <span className="font-medium">
                    {row.original.resource?.name ?? '—'}
                </span>
            ),
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
            id: 'schedule',
            header: 'Schedule',
            cell: ({ row }) => (
                <span className="text-sm">{scheduleLabel(row.original)}</span>
            ),
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
        },
        {
            accessorKey: 'payment_status',
            header: 'Payment',
            cell: ({ row }) => (
                <StatusBadge status={row.original.payment_status ?? 'unpaid'} />
            ),
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
            id: 'actions',
            header: '',
            cell: ({ row }) => (
                <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={show(row.original)}>
                            <Eye className="size-4" />
                        </Link>
                    </Button>
                    {canCancelBooking(row.original) && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setCancelTarget(row.original)}
                        >
                            <X className="size-4" />
                        </Button>
                    )}
                </div>
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

                {!canManage && stats && (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <StatCard
                            label="Upcoming"
                            value={stats.upcoming}
                            icon={CalendarClock}
                            iconClassName="bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        />
                        <StatCard
                            label="Total bookings"
                            value={stats.total}
                            icon={CalendarCheck}
                            iconClassName="bg-violet-500/10 text-violet-600 dark:text-violet-400"
                        />
                        <StatCard
                            label="Unpaid"
                            value={formatCurrency(stats.unpaid)}
                            icon={Wallet}
                            iconClassName="bg-red-500/10 text-red-600 dark:text-red-400"
                        />
                        <StatCard
                            label="Total paid"
                            value={formatCurrency(stats.paid)}
                            icon={WalletCards}
                            iconClassName="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        />
                    </div>
                )}

                {!canManage && nextBooking && (
                    <Card className="border-primary/30 bg-primary/[0.03] dark:bg-primary/[0.06]">
                        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-4">
                                <div className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-full">
                                    <CalendarClock className="size-5" />
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-primary text-xs font-semibold tracking-wide uppercase">
                                        Next booking
                                    </p>
                                    <p className="text-lg leading-none font-semibold">
                                        {nextBooking.resource?.name ?? 'Court'}
                                    </p>
                                    <p className="text-muted-foreground text-sm">
                                        {scheduleLabel(nextBooking)}
                                    </p>
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        <StatusBadge status={nextBooking.status} />
                                        <StatusBadge
                                            status={nextBooking.payment_status ?? 'unpaid'}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex shrink-0 gap-2">
                                <Button variant="outline" asChild>
                                    <Link href={show(nextBooking)}>View details</Link>
                                </Button>
                                {canCancelBooking(nextBooking) && (
                                    <Button
                                        variant="destructive"
                                        onClick={() => setCancelTarget(nextBooking)}
                                    >
                                        Cancel
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                <DataTable
                    columns={columns}
                    data={bookings.data}
                    pagination={bookings}
                    searchPlaceholder="Search by booked by..."
                    searchValue={filters.search}
                    onSearch={(value) => applyFilters({ search: value || undefined })}
<<<<<<< Updated upstream
                    rowClassName={(row) => ROW_TINT[row.status]}
                    renderCard={
                        canManage
                            ? undefined
                            : (booking) => (
                                  <BookingCard
                                      booking={booking}
                                      canCancel={canCancelBooking(booking)}
                                      onCancel={() => setCancelTarget(booking)}
                                  />
                              )
                    }
=======
>>>>>>> Stashed changes
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
                    emptyDescription="Reserve your first court to see it here."
                />
            </div>

            <ConfirmDialog
                open={cancelTarget !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setCancelTarget(null);
                        setCancelReason('');
                    }
                }}
                title="Cancel booking"
                description="Provide an optional reason for cancellation."
                confirmLabel="Cancel booking"
                variant="destructive"
                onConfirm={confirmCancel}
            >
                <Textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Reason for cancellation (optional)"
                    rows={3}
                />
            </ConfirmDialog>
        </>
    );
}

function StatCard({
    label,
    value,
    icon: Icon,
    iconClassName,
}: {
    label: string;
    value: string | number;
    icon: LucideIcon;
    iconClassName: string;
}) {
    return (
        <Card className="gap-0 py-4">
            <CardContent className="flex items-center justify-between px-4">
                <div>
                    <p className="text-muted-foreground text-xs font-medium">{label}</p>
                    <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
                </div>
                <div className={cn('rounded-md p-2', iconClassName)}>
                    <Icon className="size-4" />
                </div>
            </CardContent>
        </Card>
    );
}

function BookingCard({
    booking,
    canCancel,
    onCancel,
}: {
    booking: ResourceBooking;
    canCancel: boolean;
    onCancel: () => void;
}) {
    return (
        <Card>
            <CardContent className="space-y-3 px-4">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <p className="font-medium">{booking.resource?.name ?? '—'}</p>
                        <p className="text-muted-foreground text-sm">
                            {scheduleLabel(booking)}
                        </p>
                    </div>
                    <span className="font-semibold tabular-nums">
                        {booking.amount != null ? formatCurrency(booking.amount) : '—'}
                    </span>
                </div>
                <div className="flex flex-wrap gap-2">
                    <StatusBadge status={booking.status} />
                    <StatusBadge status={booking.payment_status ?? 'unpaid'} />
                </div>
                <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                        <Link href={show(booking)}>
                            <Eye className="size-4" />
                            View
                        </Link>
                    </Button>
                    {canCancel && (
                        <Button
                            variant="destructive"
                            size="sm"
                            className="flex-1"
                            onClick={onCancel}
                        >
                            <X className="size-4" />
                            Cancel
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

BookingsIndex.layout = {
    breadcrumbs: [{ title: 'My bookings', href: bookingsIndex() }],
};
