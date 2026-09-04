import { Head, Link, router, usePage } from '@inertiajs/react';
import { differenceInMinutes } from 'date-fns';
import { useMemo } from 'react';

import { CourtScheduleGrid, type BookingRun } from '@/components/court-schedule-grid';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate, formatTime } from '@/lib/format';
import { show as showBooking, index as bookingsIndex, reschedule as rescheduleBooking } from '@/routes/bookings';
import type { BookedSlot, DateOverride, Resource, ResourceBooking } from '@/types/booking';

type Props = {
    booking: ResourceBooking;
    resources: Resource[];
    bookedSlots: BookedSlot[];
    dateOverrides?: DateOverride[];
    canManage: boolean;
};

export default function BookingsReschedule({ booking, resources, bookedSlots, dateOverrides = [] }: Props) {
    const { auth } = usePage().props;

    const durationMinutes = differenceInMinutes(
        new Date(booking.ends_at),
        new Date(booking.starts_at),
    );
    const slotCount = Math.max(1, Math.round(durationMinutes / 60));

    const courts = useMemo(
        () => resources.filter((resource) => resource.id === booking.resource_id),
        [resources, booking.resource_id],
    );

    const handleSubmit = (
        run: BookingRun,
        options: { onStart: () => void; onFinish: () => void; onSuccess: () => void },
    ) => {
        router.patch(rescheduleBooking(booking).url, run, {
            preserveScroll: true,
            ...options,
        });
    };

    return (
        <>
            <Head title={`Reschedule booking #${booking.id}`} />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <PageHeader
                    title="Reschedule booking"
                    description="Pick a new date and time for this booking. This can only be done once, and no later than 2 days before the current booking."
                    actions={
                        <Button variant="outline" asChild>
                            <Link href={showBooking(booking)}>← Back to booking</Link>
                        </Button>
                    }
                />

                <Card className="mx-auto w-full max-w-4xl">
                    <CardContent className="space-y-1 pt-6 text-sm">
                        <p className="text-muted-foreground">Current schedule</p>
                        <p className="font-medium">
                            {booking.resource?.name ?? 'Court'} · {formatDate(booking.starts_at)} ·{' '}
                            {formatTime(booking.starts_at)} – {formatTime(booking.ends_at)}
                        </p>
                    </CardContent>
                </Card>

                <Card className="mx-auto w-full max-w-4xl">
                    <CardContent className="pt-6">
                        <CourtScheduleGrid
                            courts={courts}
                            bookedSlots={bookedSlots}
                            dateOverrides={dateOverrides}
                            isAuthenticated={!!auth.user}
                            slotCount={slotCount}
                            onSubmit={handleSubmit}
                            submitLabel="Confirm new schedule"
                        />
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

BookingsReschedule.layout = {
    breadcrumbs: [
        { title: 'Bookings', href: bookingsIndex() },
        { title: 'Reschedule', href: '#' },
    ],
};
