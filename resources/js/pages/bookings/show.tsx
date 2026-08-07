import { Head, Link, router } from '@inertiajs/react';
import { differenceInMinutes } from 'date-fns';
import {
    Calendar,
    CheckCircle2,
    Circle,
    Clock,
    CreditCard,
    Mail,
    MapPin,
    User,
    Wallet,
    XCircle,
} from 'lucide-react';
import { useState   } from 'react';
import type {ComponentType, ReactNode} from 'react';

import { ConfirmDialog } from '@/components/confirm-dialog';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency, formatDate, formatDateTime, formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import {
    cancel,
    index as bookingsIndex,
    markPaid,
} from '@/routes/bookings';
import type { ResourceBooking } from '@/types/booking';

type Props = {
    booking: ResourceBooking;
    canManage?: boolean;
};

export default function BookingsShow({ booking, canManage = false }: Props) {
    const [cancelOpen, setCancelOpen] = useState(false);
    const [reason, setReason] = useState('');

    const canMarkPaid =
        canManage &&
        booking.payment_status === 'unpaid' &&
        !['cancelled', 'rejected'].includes(booking.status);
    const canCancel = !['cancelled', 'completed', 'rejected'].includes(
        booking.status,
    );

    const durationMinutes = differenceInMinutes(
        new Date(booking.ends_at),
        new Date(booking.starts_at),
    );
    const durationLabel =
        durationMinutes % 60 === 0
            ? `${durationMinutes / 60} hr${durationMinutes / 60 !== 1 ? 's' : ''}`
            : `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`;

    const isCancelledOrRejected = ['cancelled', 'rejected'].includes(
        booking.status,
    );

    const timeline = [
        {
            label: 'Booking created',
            done: true,
            timestamp: booking.created_at,
        },
        {
            label: 'Payment received',
            done: booking.payment_status === 'paid',
            timestamp: null,
        },
        isCancelledOrRejected
            ? {
                  label:
                      booking.status === 'cancelled'
                          ? 'Booking cancelled'
                          : 'Booking rejected',
                  done: true,
                  failed: true,
                  timestamp: null,
              }
            : {
                  label: 'Booking approved',
                  done: ['approved', 'completed'].includes(booking.status),
                  timestamp: null,
              },
        ...(isCancelledOrRejected
            ? []
            : [
                  {
                      label: 'Booking completed',
                      done: booking.status === 'completed',
                      timestamp: null,
                  },
              ]),
    ];

    return (
        <>
            <Head title={`Booking #${booking.id}`} />
            <div className="flex flex-1 flex-col gap-6 p-4">
                {/* Hero */}
                <Card>
                    <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-2xl font-semibold tracking-tight">
                                    Booking #{booking.id}
                                </h1>
                                <StatusBadge
                                    status={booking.status}
                                    className="px-2.5 py-1 text-sm"
                                />
                                <StatusBadge
                                    status={booking.payment_status ?? 'unpaid'}
                                    className="px-2.5 py-1 text-sm"
                                />
                            </div>
                            <p className="text-muted-foreground text-sm">
                                {booking.resource?.name ?? 'Court'}
                            </p>
                            <p className="flex items-center gap-1.5 text-sm font-medium">
                                <Calendar className="text-muted-foreground size-4" />
                                {formatDate(booking.starts_at)}
                                <span className="text-muted-foreground">·</span>
                                <Clock className="text-muted-foreground size-4" />
                                {formatTime(booking.starts_at)} –{' '}
                                {formatTime(booking.ends_at)}
                            </p>
                        </div>

                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                            <Button variant="outline" asChild>
                                <Link href={bookingsIndex()}>← Back</Link>
                            </Button>
                            {canMarkPaid ? (
                                <Button
                                    onClick={() =>
                                        router.patch(markPaid(booking).url, {}, {
                                            preserveScroll: true,
                                            preserveState: true,
                                        })
                                    }
                                >
                                    Mark as paid
                                </Button>
                            ) : null}
                            {canCancel ? (
                                <Button
                                    variant="destructive"
                                    onClick={() => setCancelOpen(true)}
                                >
                                    Cancel booking
                                </Button>
                            ) : null}
                        </div>
                    </CardContent>
                </Card>

                {/* Quick stats */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <QuickStat label="Status" value={<StatusBadge status={booking.status} />} />
                    <QuickStat
                        label="Payment"
                        value={
                            <StatusBadge status={booking.payment_status ?? 'unpaid'} />
                        }
                    />
                    <QuickStat label="Duration" value={durationLabel} />
                    <QuickStat
                        label="Amount"
                        value={
                            booking.amount != null
                                ? formatCurrency(booking.amount)
                                : '—'
                        }
                    />
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Booking summary</CardTitle>
                        </CardHeader>
                        <CardContent className="divide-y text-sm">
                            <SummaryRow icon={Calendar} label="Date">
                                {formatDate(booking.starts_at)}
                            </SummaryRow>
                            <SummaryRow icon={Clock} label="Time">
                                {formatTime(booking.starts_at)} –{' '}
                                {formatTime(booking.ends_at)}
                            </SummaryRow>
                            <SummaryRow icon={MapPin} label="Court">
                                {booking.resource?.name ?? '—'}
                            </SummaryRow>
                            <SummaryRow icon={Wallet} label="Amount">
                                {booking.amount != null
                                    ? formatCurrency(booking.amount)
                                    : '—'}
                            </SummaryRow>
                            <SummaryRow icon={CreditCard} label="Payment">
                                <StatusBadge
                                    status={booking.payment_status ?? 'unpaid'}
                                />
                            </SummaryRow>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Customer</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-full">
                                    <User className="size-5" />
                                </div>
                                <div>
                                    <p className="font-medium">
                                        {booking.user?.name ?? '—'}
                                    </p>
                                    <p className="text-muted-foreground flex items-center gap-1 text-xs">
                                        <Mail className="size-3" />
                                        {booking.user?.email ?? '—'}
                                    </p>
                                </div>
                            </div>

                            {booking.approver ? (
                                <div className="border-t pt-3">
                                    <p className="text-muted-foreground text-xs">
                                        Approved by
                                    </p>
                                    <p>{booking.approver.name}</p>
                                </div>
                            ) : null}
                        </CardContent>
                    </Card>
                </div>

                {/* Timeline */}
                <Card>
                    <CardHeader>
                        <CardTitle>Timeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ol className="space-y-4">
                            {timeline.map((step) => (
                                <li
                                    key={step.label}
                                    className="flex items-center gap-3 text-sm"
                                >
                                    {step.done ? (
                                        'failed' in step && step.failed ? (
                                            <XCircle className="text-destructive size-5 shrink-0" />
                                        ) : (
                                            <CheckCircle2 className="size-5 shrink-0 text-emerald-500" />
                                        )
                                    ) : (
                                        <Circle className="text-muted-foreground size-5 shrink-0" />
                                    )}
                                    <span
                                        className={cn(
                                            step.done
                                                ? 'font-medium'
                                                : 'text-muted-foreground',
                                        )}
                                    >
                                        {step.label}
                                    </span>
                                    {step.timestamp ? (
                                        <span className="text-muted-foreground ml-auto text-xs">
                                            {formatDateTime(step.timestamp)}
                                        </span>
                                    ) : null}
                                </li>
                            ))}
                        </ol>
                    </CardContent>
                </Card>

                {/* Notes */}
                {booking.notes || booking.cancellation_reason ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>Notes</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            {booking.notes ? <p>{booking.notes}</p> : null}
                            {booking.cancellation_reason ? (
                                <div>
                                    <p className="text-muted-foreground mb-1 text-xs">
                                        Cancellation reason
                                    </p>
                                    <p>{booking.cancellation_reason}</p>
                                </div>
                            ) : null}
                        </CardContent>
                    </Card>
                ) : null}
            </div>

            <ConfirmDialog
                open={cancelOpen}
                onOpenChange={setCancelOpen}
                title="Cancel booking"
                description="Provide an optional reason for cancellation."
                confirmLabel="Cancel booking"
                variant="destructive"
                onConfirm={() =>
                    router.patch(
                        cancel(booking).url,
                        { cancellation_reason: reason || undefined },
                        { preserveScroll: true, preserveState: true },
                    )
                }
            >
                <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Reason for cancellation (optional)"
                    rows={3}
                />
            </ConfirmDialog>
        </>
    );
}

function QuickStat({
    label,
    value,
}: {
    label: string;
    value: ReactNode;
}) {
    return (
        <Card>
            <CardContent className="p-3">
                <p className="text-muted-foreground text-xs">{label}</p>
                <div className="mt-1 text-sm font-semibold">{value}</div>
            </CardContent>
        </Card>
    );
}

function SummaryRow({
    icon: Icon,
    label,
    children,
}: {
    icon: ComponentType<{ className?: string }>;
    label: string;
    children: ReactNode;
}) {
    return (
        <div className="flex items-center justify-between gap-4 py-2 first:pt-0 last:pb-0">
            <span className="text-muted-foreground flex items-center gap-2">
                <Icon className="size-4" />
                {label}
            </span>
            <span className="font-medium">{children}</span>
        </div>
    );
}

BookingsShow.layout = {
    breadcrumbs: [{ title: 'Bookings', href: bookingsIndex() }],
};
