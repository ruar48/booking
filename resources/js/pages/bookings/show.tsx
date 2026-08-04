import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

import { ConfirmDialog } from '@/components/confirm-dialog';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency, formatDateTime } from '@/lib/format';
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

    return (
        <>
            <Head title={`Booking #${booking.id}`} />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <PageHeader
                    title={`Booking #${booking.id}`}
                    description={booking.resource?.club?.name}
                    actions={
                        <div className="flex flex-wrap gap-2">
                            {canMarkPaid ? (
                                <Button
                                    onClick={() =>
                                        router.patch(markPaid(booking).url)
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
                            <Button variant="outline" asChild>
                                <Link href={bookingsIndex()}>Back</Link>
                            </Button>
                        </div>
                    }
                />

                <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Booking details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Payment
                                </span>
                                <StatusBadge
                                    status={booking.payment_status ?? 'unpaid'}
                                />
                            </div>
                            {canManage ? (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Booking status
                                    </span>
                                    <StatusBadge status={booking.status} />
                                </div>
                            ) : null}
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Court</span>
                                <span>{booking.resource?.name ?? '—'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Club</span>
                                <span>{booking.resource?.club?.name ?? '—'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Starts</span>
                                <span>{formatDateTime(booking.starts_at)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Ends</span>
                                <span>{formatDateTime(booking.ends_at)}</span>
                            </div>
                            {booking.amount != null ? (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Amount</span>
                                    <span>{formatCurrency(booking.amount)}</span>
                                </div>
                            ) : null}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Booked by</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Name</span>
                                <span>{booking.user?.name ?? '—'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Email</span>
                                <span>{booking.user?.email ?? '—'}</span>
                            </div>
                            {booking.notes ? (
                                <div className="pt-2">
                                    <p className="text-muted-foreground mb-1">Notes</p>
                                    <p>{booking.notes}</p>
                                </div>
                            ) : null}
                            {booking.cancellation_reason ? (
                                <div className="pt-2">
                                    <p className="text-muted-foreground mb-1">
                                        Cancellation reason
                                    </p>
                                    <p>{booking.cancellation_reason}</p>
                                </div>
                            ) : null}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <ConfirmDialog
                open={cancelOpen}
                onOpenChange={setCancelOpen}
                title="Cancel booking"
                description="Provide an optional reason for cancellation."
                confirmLabel="Cancel booking"
                variant="destructive"
                onConfirm={() =>
                    router.patch(cancel(booking).url, {
                        cancellation_reason: reason || undefined,
                    })
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

BookingsShow.layout = {
    breadcrumbs: [{ title: 'Bookings', href: bookingsIndex() }],
};
