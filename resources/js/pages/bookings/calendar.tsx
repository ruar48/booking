import { Head, Link, router } from '@inertiajs/react';
import {
    addMonths,
    eachDayOfInterval,
    endOfMonth,
    endOfWeek,
    format,
    isSameMonth,
    isToday,
    parseISO,
    startOfMonth,
    startOfWeek,
    subMonths,
} from 'date-fns';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';

import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { calendar, create, show, index as bookingsIndex } from '@/routes/bookings';
import type { ResourceBooking } from '@/types/booking';

type Props = {
    bookings: ResourceBooking[];
    filters: {
        club_id?: number | null;
        start?: string;
        end?: string;
    };
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const statusDotClasses: Record<string, string> = {
    pending: 'bg-amber-500',
    approved: 'bg-emerald-500',
    rejected: 'bg-red-500',
    cancelled: 'bg-zinc-400',
    completed: 'bg-blue-500',
};

export default function BookingsCalendar({ bookings, filters }: Props) {
    const anchorDate = filters.start ? parseISO(filters.start) : new Date();
    const [monthCursor, setMonthCursor] = useState(startOfMonth(anchorDate));

    const grouped = useMemo(() => {
        const map = new Map<string, ResourceBooking[]>();

        for (const booking of bookings) {
            const key = booking.starts_at.split('T')[0];
            const list = map.get(key) ?? [];
            list.push(booking);
            map.set(key, list);
        }

        for (const list of map.values()) {
            list.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
        }

        return map;
    }, [bookings]);

    const days = useMemo(() => {
        const gridStart = startOfWeek(startOfMonth(monthCursor));
        const gridEnd = endOfWeek(endOfMonth(monthCursor));

        return eachDayOfInterval({ start: gridStart, end: gridEnd });
    }, [monthCursor]);

    const totalThisMonth = useMemo(
        () =>
            bookings.filter((booking) =>
                isSameMonth(parseISO(booking.starts_at), monthCursor),
            ).length,
        [bookings, monthCursor],
    );

    function navigate(next: Date) {
        setMonthCursor(next);
        router.get(
            calendar.url(),
            {
                club_id: filters.club_id ?? undefined,
                start: format(startOfMonth(next), 'yyyy-MM-dd'),
                end: format(endOfMonth(next), 'yyyy-MM-dd'),
            },
            { preserveState: true, preserveScroll: true },
        );
    }

    return (
        <>
            <Head title="Booking Calendar" />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <PageHeader
                    title="Booking calendar"
                    description={`${totalThisMonth} booking${totalThisMonth !== 1 ? 's' : ''} in ${format(monthCursor, 'MMMM yyyy')}`}
                    actions={
                        <Button asChild>
                            <Link href={create()}>
                                <CalendarDays className="size-4" />
                                New booking
                            </Link>
                        </Button>
                    }
                />

                <Card>
                    <CardContent className="p-4">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold">
                                {format(monthCursor, 'MMMM yyyy')}
                            </h2>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate(subMonths(monthCursor, 1))}
                                >
                                    <ChevronLeft className="size-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate(startOfMonth(new Date()))}
                                >
                                    Today
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate(addMonths(monthCursor, 1))}
                                >
                                    <ChevronRight className="size-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border bg-border">
                            {WEEKDAYS.map((weekday) => (
                                <div
                                    key={weekday}
                                    className="bg-muted text-muted-foreground p-2 text-center text-xs font-medium"
                                >
                                    {weekday}
                                </div>
                            ))}

                            {days.map((day) => {
                                const key = format(day, 'yyyy-MM-dd');
                                const dayBookings = grouped.get(key) ?? [];
                                const inMonth = isSameMonth(day, monthCursor);
                                const visible = dayBookings.slice(0, 3);
                                const overflow = dayBookings.length - visible.length;

                                return (
                                    <div
                                        key={key}
                                        className={cn(
                                            'bg-background flex min-h-28 flex-col gap-1 p-1.5 sm:min-h-32',
                                            !inMonth && 'bg-muted/40',
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span
                                                className={cn(
                                                    'text-xs font-medium',
                                                    !inMonth && 'text-muted-foreground',
                                                    isToday(day) &&
                                                        'bg-primary text-primary-foreground flex size-5 items-center justify-center rounded-full',
                                                )}
                                            >
                                                {format(day, 'd')}
                                            </span>
                                            {dayBookings.length > 0 && (
                                                <Badge
                                                    variant="secondary"
                                                    className="h-4 px-1.5 text-[10px]"
                                                >
                                                    {dayBookings.length}
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="flex flex-1 flex-col gap-0.5">
                                            {visible.map((booking) => (
                                                <Popover key={booking.id}>
                                                    <PopoverTrigger asChild>
                                                        <button
                                                            type="button"
                                                            className="flex items-center gap-1 truncate rounded px-1 py-0.5 text-left text-[11px] hover:bg-accent"
                                                        >
                                                            <span
                                                                className={cn(
                                                                    'size-1.5 shrink-0 rounded-full',
                                                                    statusDotClasses[
                                                                        booking.status.toLowerCase()
                                                                    ] ?? 'bg-zinc-400',
                                                                )}
                                                            />
                                                            <span className="truncate">
                                                                {formatTime(booking.starts_at)}{' '}
                                                                {booking.resource?.name ?? 'Court'}
                                                            </span>
                                                        </button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-72">
                                                        <BookingDetail booking={booking} />
                                                    </PopoverContent>
                                                </Popover>
                                            ))}

                                            {overflow > 0 && (
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <button
                                                            type="button"
                                                            className="text-muted-foreground px-1 text-left text-[11px] hover:underline"
                                                        >
                                                            +{overflow} more
                                                        </button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-80">
                                                        <p className="mb-2 text-sm font-medium">
                                                            {format(day, 'MMM d, yyyy')} —{' '}
                                                            {dayBookings.length} booking
                                                            {dayBookings.length !== 1 ? 's' : ''}
                                                        </p>
                                                        <div className="max-h-72 space-y-2 overflow-y-auto">
                                                            {dayBookings.map((booking) => (
                                                                <BookingDetail
                                                                    key={booking.id}
                                                                    booking={booking}
                                                                    compact
                                                                />
                                                            ))}
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

function BookingDetail({
    booking,
    compact = false,
}: {
    booking: ResourceBooking;
    compact?: boolean;
}) {
    return (
        <div className={cn('space-y-1', compact && 'border-b pb-2 last:border-0 last:pb-0')}>
            <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium">{booking.resource?.name ?? 'Court'}</p>
                <StatusBadge status={booking.status} />
            </div>
            <p className="text-muted-foreground text-xs">
                {formatTime(booking.starts_at)} – {formatTime(booking.ends_at)}
            </p>
            <p className="text-muted-foreground text-xs">{booking.user?.name}</p>
            <Link
                href={show(booking.id)}
                className="text-primary inline-block text-xs font-medium hover:underline"
            >
                View details →
            </Link>
        </div>
    );
}

BookingsCalendar.layout = {
    breadcrumbs: [{ title: 'Bookings', href: bookingsIndex() }],
};
