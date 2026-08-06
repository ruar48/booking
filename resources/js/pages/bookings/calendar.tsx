import { Head, Link, router, useForm } from '@inertiajs/react';
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
import { FormEvent, useMemo, useState } from 'react';

import InputError from '@/components/input-error';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { calendar, create, show, index as bookingsIndex } from '@/routes/bookings';
import { closeDate, reopenDate } from '@/routes/bookings/calendar';
import type { DateOverride, ResourceBooking } from '@/types/booking';

type OperatingHours = Record<
    string,
    { open: string | null; close: string | null; closed: boolean }
> | null;

type Props = {
    bookings: ResourceBooking[];
    dateOverrides: DateOverride[];
    operatingHours: OperatingHours;
    filters: {
        club_id?: number | null;
        start?: string;
        end?: string;
    };
};

function defaultHoursFor(date: string, operatingHours: OperatingHours) {
    const weekday = format(parseISO(date), 'EEEE').toLowerCase();
    const day = operatingHours?.[weekday];

    return {
        open: day?.open ?? '07:00',
        close: day?.close ?? '22:00',
    };
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const statusDotClasses: Record<string, string> = {
    pending: 'bg-amber-500',
    approved: 'bg-emerald-500',
    rejected: 'bg-red-500',
    cancelled: 'bg-zinc-400',
    completed: 'bg-blue-500',
};

export default function BookingsCalendar({ bookings, dateOverrides, operatingHours, filters }: Props) {
    const anchorDate = filters.start ? parseISO(filters.start) : new Date();
    const [monthCursor, setMonthCursor] = useState(startOfMonth(anchorDate));
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

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

    const overridesByDate = useMemo(() => {
        const map = new Map<string, DateOverride>();

        for (const override of dateOverrides) {
            map.set(override.date.split('T')[0], override);
        }

        return map;
    }, [dateOverrides]);

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
                                const override = overridesByDate.get(key);
                                const isOpenDay = override?.is_closed === false;

                                return (
                                    <div
                                        key={key}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => setSelectedDate(key)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                setSelectedDate(key);
                                            }
                                        }}
                                        className={cn(
                                            'bg-background outline-none flex min-h-28 cursor-pointer flex-col gap-1 p-1.5 text-left transition-colors hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:min-h-32',
                                            !inMonth && 'bg-muted/40',
                                            !isOpenDay && 'bg-destructive/5 hover:bg-destructive/10',
                                        )}
                                    >
                                        <div className="flex items-center justify-between gap-1">
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

                                        <Badge
                                            variant={isOpenDay ? 'default' : 'outline'}
                                            className={cn(
                                                'h-4 w-fit px-1.5 text-[10px] font-medium',
                                                isOpenDay
                                                    ? 'bg-emerald-600 hover:bg-emerald-600'
                                                    : 'text-destructive border-destructive/40',
                                            )}
                                        >
                                            {isOpenDay ? 'Open' : 'Closed'}
                                        </Badge>

                                        <div
                                            className="flex flex-1 flex-col gap-0.5"
                                            onClick={(e) => e.stopPropagation()}
                                        >
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

            {selectedDate && (
                <DateOverrideDialog
                    date={selectedDate}
                    override={overridesByDate.get(selectedDate)}
                    dayBookings={grouped.get(selectedDate) ?? []}
                    operatingHours={operatingHours}
                    onClose={() => setSelectedDate(null)}
                />
            )}
        </>
    );
}

function DateOverrideDialog({
    date,
    override,
    dayBookings,
    operatingHours,
    onClose,
}: {
    date: string;
    override?: DateOverride;
    dayBookings: ResourceBooking[];
    operatingHours: OperatingHours;
    onClose: () => void;
}) {
    const wasOpen = override?.is_closed === false;
    const [isOpen, setIsOpen] = useState(wasOpen);
    const suggested = defaultHoursFor(date, operatingHours);

    const openForm = useForm({
        date,
        open_time: override?.open_time?.slice(0, 5) ?? suggested.open ?? '07:00',
        close_time: override?.close_time?.slice(0, 5) ?? suggested.close ?? '22:00',
    });

    const closeForm = useForm({
        date,
        reason: override?.reason ?? '',
    });

    function submit(e: FormEvent) {
        e.preventDefault();

        if (isOpen) {
            openForm.post(reopenDate().url, { preserveScroll: true, onSuccess: onClose });
        } else {
            closeForm.post(closeDate().url, { preserveScroll: true, onSuccess: onClose });
        }
    }

    const processing = openForm.processing || closeForm.processing;

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{format(parseISO(date), 'MMMM d, yyyy')}</DialogTitle>
                    <DialogDescription>
                        Dates are closed for booking by default. Open this date and set its
                        hours before members can book it.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                            <p className="text-sm font-medium">
                                {isOpen ? 'Open for bookings' : 'Closed for bookings'}
                            </p>
                            <p className="text-muted-foreground text-xs">
                                {isOpen
                                    ? 'Members can book this date within the hours below.'
                                    : 'No one can book this date.'}
                            </p>
                        </div>
                        <Switch checked={isOpen} onCheckedChange={setIsOpen} />
                    </div>

                    {isOpen ? (
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label htmlFor="open_time">Open</Label>
                                <Input
                                    id="open_time"
                                    type="time"
                                    value={openForm.data.open_time}
                                    onChange={(e) => openForm.setData('open_time', e.target.value)}
                                />
                                <InputError message={openForm.errors.open_time} />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="close_time">Close</Label>
                                <Input
                                    id="close_time"
                                    type="time"
                                    value={openForm.data.close_time}
                                    onChange={(e) => openForm.setData('close_time', e.target.value)}
                                />
                                <InputError message={openForm.errors.close_time} />
                            </div>
                        </div>
                    ) : (
                        <>
                            {dayBookings.length > 0 && (
                                <Alert variant="destructive">
                                    <AlertTitle>
                                        {dayBookings.length} existing booking
                                        {dayBookings.length !== 1 ? 's' : ''} on this date
                                    </AlertTitle>
                                    <AlertDescription>
                                        Closing this date only blocks new bookings — existing
                                        bookings won&apos;t be cancelled automatically. Review
                                        them from the calendar first if needed.
                                    </AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-1">
                                <Label htmlFor="reason">Reason (optional)</Label>
                                <Textarea
                                    id="reason"
                                    value={closeForm.data.reason}
                                    onChange={(e) => closeForm.setData('reason', e.target.value)}
                                    placeholder="e.g. Public holiday, maintenance"
                                />
                                <InputError message={closeForm.errors.reason} />
                            </div>
                        </>
                    )}

                    <DialogFooter>
                        <Button
                            type="submit"
                            variant={isOpen ? 'default' : 'destructive'}
                            disabled={processing}
                        >
                            {isOpen ? 'Save & open date' : 'Close this date'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
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
