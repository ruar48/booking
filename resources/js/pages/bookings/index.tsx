import { Head, Link, router } from '@inertiajs/react';
import { type ColumnDef } from '@tanstack/react-table';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import {
    Calendar,
    CalendarCheck,
    CalendarClock,
    Clock,
    Eye,
    Plus,
    Wallet,
    WalletCards,
    X,
} from 'lucide-react';
import { useCallback, useState } from 'react';

import { ConfirmDialog } from '@/components/confirm-dialog';
import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
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
import {
    calendar as bookingsCalendar,
    cancel,
    create,
    index as bookingsIndex,
    show,
} from '@/routes/bookings';
import { edit as editReschedule } from '@/routes/bookings/reschedule';
import type {
    BookingStats,
    Paginated,
    Resource,
    ResourceBooking,
} from '@/types/booking';

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
    stats?: BookingStats | null;
    nextBooking?: ResourceBooking | null;
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

function pluralize(count: number | undefined, noun: string): string | undefined {
    if (count == null) {
        return undefined;
    }

    return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

export default function BookingsIndex({
    bookings,
    canManage = false,
    filters = {},
    resources = [],
    stats = null,
    nextBooking = null,
}: Props) {
    const [cancelTarget, setCancelTarget] = useState<ResourceBooking | null>(
        null,
    );
    const [cancelReason, setCancelReason] = useState('');

    const applyFilters = useCallback(
        (next: Partial<BookingFilters>) => {
            router.get(
                bookingsIndex().url,
                { ...filters, ...next },
                { preserveState: true, replace: true },
            );
        },
        [filters],
    );

    const today = () => {
        const now = new Date();
        const offset = now.getTimezoneOffset();
        return new Date(now.getTime() - offset * 60000)
            .toISOString()
            .slice(0, 10);
    };

    const hasActiveFilters = Boolean(
        filters.search ||
            filters.status ||
            filters.payment_status ||
            filters.resource_id ||
            filters.date,
    );

    const clearFilters = () => {
        router.get(bookingsIndex().url, {}, { preserveState: true, replace: true });
    };

    // Decided per booking by the policy, not guessed from status here: members
    // may drop an unpaid booking but not a confirmed one, and admins can always
    // cancel a live booking.
    const canCancelBooking = useCallback(
        (booking: ResourceBooking) =>
            booking.can_cancel === true &&
            !['cancelled', 'completed', 'rejected'].includes(booking.status),
        [],
    );

    const confirmCancel = () => {
        if (!cancelTarget) return;

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
                                  row.original.created_by !==
                                      row.original.user_id && (
                                      <span className="border-border bg-muted text-muted-foreground rounded border px-1.5 py-0.5 text-[10px] font-medium tracking-wide uppercase">
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
            cell: ({ row }) => (
                <span className="tabular-nums">
                    {row.original.amount != null
                        ? formatCurrency(row.original.amount)
                        : '—'}
                </span>
            ),
        },
        {
            id: 'actions',
            header: '',
            cell: ({ row }) => (
                <div className="flex justify-end gap-1.5">
                    <Button
                        variant="outline"
                        size="icon"
                        asChild
                        className="text-muted-foreground hover:text-foreground size-8"
                        title="View details"
                    >
                        <Link href={show(row.original)}>
                            <Eye className="size-4" />
                        </Link>
                    </Button>
                    {row.original.can_reschedule && (
                        <Button
                            variant="outline"
                            size="icon"
                            asChild
                            className="text-primary hover:text-primary hover:bg-primary/5 border-primary/25 size-8"
                            title="Reschedule"
                        >
                            <Link href={editReschedule(row.original)}>
                                <CalendarClock className="size-4" />
                            </Link>
                        </Button>
                    )}
                    {canCancelBooking(row.original) && (
                        <Button
                            variant="outline"
                            size="icon"
                            className="text-destructive hover:text-destructive size-8 border-red-200 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/30"
                            title="Cancel booking"
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
                            caption="Bookings"
                            icon={CalendarClock}
                            tone="blue"
                            sparkline={stats.trends?.upcoming}
                        />
                        <StatCard
                            label="Total bookings"
                            value={stats.total}
                            caption="All time"
                            icon={CalendarCheck}
                            tone="violet"
                            sparkline={stats.trends?.total}
                        />
                        <StatCard
                            label="Unpaid"
                            value={formatCurrency(stats.unpaid)}
                            caption={pluralize(stats.unpaid_count, 'booking')}
                            icon={Wallet}
                            tone="red"
                            sparkline={stats.trends?.unpaid}
                        />
                        <StatCard
                            label="Total paid"
                            value={formatCurrency(stats.paid)}
                            caption="Paid bookings"
                            icon={WalletCards}
                            tone="emerald"
                            sparkline={stats.trends?.paid}
                        />
                    </div>
                )}

                {!canManage && nextBooking && (
                    <NextBookingCard
                        booking={nextBooking}
                        canCancel={canCancelBooking(nextBooking)}
                        onCancel={() => setCancelTarget(nextBooking)}
                    />
                )}

                <DataTable
                    columns={columns}
                    data={bookings.data}
                    pagination={bookings}
                    searchPlaceholder="Search by booked by..."
                    paginationUnit="booking"
                    searchValue={filters.search}
                    onSearch={(value) =>
                        applyFilters({ search: value || undefined })
                    }
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
                    filters={
                        // Two columns on a phone so the controls line up
                        // instead of wrapping ragged; inline once there's room.
                        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
                            <Select
                                value={filters.status ?? 'all'}
                                onValueChange={(value) =>
                                    applyFilters({
                                        status: value === 'all' ? undefined : value,
                                    })
                                }
                            >
                                <SelectTrigger className="w-full sm:w-[150px]">
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
                                <SelectTrigger className="w-full sm:w-[150px]">
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
                                    <SelectTrigger className="w-full sm:w-[170px]">
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
                            {/* Date and its shortcut stay paired on one row,
                                spanning both phone columns. min-w-0 keeps the
                                native date picker's icon from being clipped. */}
                            <div className="col-span-2 flex gap-2 sm:col-span-1 sm:contents">
                                <Input
                                    type="date"
                                    value={filters.date ?? ''}
                                    onChange={(event) =>
                                        applyFilters({
                                            date: event.target.value || undefined,
                                        })
                                    }
                                    className="min-w-0 flex-1 sm:w-[150px] sm:flex-none"
                                />
                                <Button
                                    variant="outline"
                                    className="shrink-0"
                                    onClick={() => applyFilters({ date: today() })}
                                >
                                    Today
                                </Button>
                            </div>
                            {hasActiveFilters && (
                                <Button
                                    variant="ghost"
                                    className="col-span-2 sm:col-span-1"
                                    onClick={clearFilters}
                                >
                                    <X className="size-4" />
                                    Clear filters
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

function NextBookingCard({
    booking,
    canCancel,
    onCancel,
}: {
    booking: ResourceBooking;
    canCancel: boolean;
    onCancel: () => void;
}) {
    return (
        <Card className="relative overflow-hidden">
            <CourtDecor />
            <CardContent className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                    <div className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-full">
                        <CalendarClock className="size-5" />
                    </div>
                    <div className="space-y-1.5">
                        <p className="text-primary text-xs font-semibold tracking-wide uppercase">
                            Next booking
                        </p>
                        <p className="text-xl leading-none font-bold">
                            {booking.resource?.name ?? 'Court'}
                        </p>
                        <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
                            <Clock className="size-3.5" />
                            {scheduleLabel(booking)}
                        </p>
                        <div className="flex flex-wrap gap-2 pt-1">
                            <StatusBadge status={booking.status} />
                            <StatusBadge
                                status={booking.payment_status ?? 'unpaid'}
                            />
                        </div>
                    </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                    <Button variant="outline" asChild>
                        <Link href={show(booking)}>View details</Link>
                    </Button>
                    {booking.can_reschedule && (
                        <Button variant="outline" asChild>
                            <Link href={editReschedule(booking)}>
                                Reschedule
                            </Link>
                        </Button>
                    )}
                    {canCancel && (
                        <Button variant="destructive" onClick={onCancel}>
                            Cancel
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * Faint paddle-and-net line art bleeding off the right edge of the next-booking
 * card. Purely decorative, so it stays out of the accessibility tree.
 */
function CourtDecor() {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 240 140"
            fill="none"
            className="text-primary/[0.13] pointer-events-none absolute -top-2 right-0 hidden h-[130%] w-60 lg:block"
        >
            <g stroke="currentColor" strokeWidth="2">
                <ellipse cx="88" cy="52" rx="26" ry="33" transform="rotate(-24 88 52)" />
                <path d="M97 84 L106 108" strokeLinecap="round" />
                <ellipse cx="146" cy="58" rx="26" ry="33" transform="rotate(20 146 58)" />
                <path d="M136 90 L128 113" strokeLinecap="round" />
                <path d="M186 40 H236 M186 40 V96 M236 40 V96 M186 96 H236" />
                <path d="M196 40 V96 M206 40 V96 M216 40 V96 M226 40 V96" strokeWidth="1" />
                <path d="M186 54 H236 M186 68 H236 M186 82 H236" strokeWidth="1" />
            </g>
        </svg>
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
                        <p className="font-medium">
                            {booking.resource?.name ?? '—'}
                        </p>
                        <p className="text-muted-foreground text-sm">
                            {scheduleLabel(booking)}
                        </p>
                    </div>
                    <span className="font-semibold tabular-nums">
                        {booking.amount != null
                            ? formatCurrency(booking.amount)
                            : '—'}
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
                    {booking.can_reschedule && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            asChild
                        >
                            <Link href={editReschedule(booking)}>
                                <CalendarClock className="size-4" />
                                Reschedule
                            </Link>
                        </Button>
                    )}
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
