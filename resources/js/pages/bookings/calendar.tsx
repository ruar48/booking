import { Head, Link } from '@inertiajs/react';
import { CalendarDays } from 'lucide-react';

import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateTime } from '@/lib/format';
import { create, index as bookingsIndex } from '@/routes/bookings';
import type { ResourceBooking } from '@/types/booking';

type Props = {
    bookings: ResourceBooking[];
    filters: {
        club_id?: number | null;
        start?: string;
        end?: string;
    };
};

export default function BookingsCalendar({ bookings, filters }: Props) {
    const grouped = bookings.reduce<Record<string, ResourceBooking[]>>(
        (acc, booking) => {
            const day = booking.starts_at.split('T')[0];
            acc[day] = acc[day] ?? [];
            acc[day].push(booking);
            return acc;
        },
        {},
    );

    const days = Object.keys(grouped).sort();

    return (
        <>
            <Head title="Booking Calendar" />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <PageHeader
                    title="Booking calendar"
                    description={
                        filters.start && filters.end
                            ? `${filters.start} — ${filters.end}`
                            : 'Court reservations by day'
                    }
                    actions={
                        <Button asChild>
                            <Link href={create()}>
                                <CalendarDays className="size-4" />
                                New booking
                            </Link>
                        </Button>
                    }
                />

                {days.length ? (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {days.map((day) => (
                            <Card key={day}>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">{day}</CardTitle>
                                    <Badge variant="secondary">
                                        {grouped[day].length} booking
                                        {grouped[day].length !== 1 ? 's' : ''}
                                    </Badge>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {grouped[day].map((booking) => (
                                        <div
                                            key={booking.id}
                                            className="rounded-lg border p-3 text-sm"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p className="font-medium">
                                                        {booking.resource?.name ?? 'Court'}
                                                    </p>
                                                    <p className="text-muted-foreground text-xs">
                                                        {formatDateTime(booking.starts_at)}{' '}
                                                        – {formatDateTime(booking.ends_at)}
                                                    </p>
                                                    <p className="text-muted-foreground text-xs">
                                                        {booking.user?.name}
                                                    </p>
                                                </div>
                                                <StatusBadge status={booking.status} />
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="text-muted-foreground py-16 text-center text-sm">
                            No bookings in this date range
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}

BookingsCalendar.layout = {
    breadcrumbs: [{ title: 'Bookings', href: bookingsIndex() }],
};
