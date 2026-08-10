import { router, usePage } from '@inertiajs/react';
import {
    addDays,
    addMonths,
    eachDayOfInterval,
    endOfMonth,
    endOfWeek,
    format,
    isSameMonth,
    parseISO,
    startOfMonth,
    startOfWeek,
    subDays,
    subMonths,
} from 'date-fns';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { register } from '@/routes';
import { storeBulk as storeBookingsBulk, storeWalkIn as storeWalkInBooking } from '@/routes/bookings';
import type { BookedSlot, DateOverride, RecurringScheduleLock, Resource, ScheduleBlock } from '@/types/booking';

export type WalkInCustomerPayload =
    | { mode: 'existing'; user_id: number }
    | { mode: 'new'; name: string; phone: string };

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type SlotSelection = {
    courtId: number;
    courtName: string;
    slot: string;
};

type Props = {
    courts: Resource[];
    bookedSlots: BookedSlot[];
    scheduleBlocks?: ScheduleBlock[];
    recurringLocks?: RecurringScheduleLock[];
    dateOverrides?: DateOverride[];
    isAuthenticated: boolean;
    processing?: boolean;
    errors?: Record<string, string>;
    customer?: WalkInCustomerPayload | null;
    markPaid?: boolean;
};

type BookingRun = {
    resource_id: number;
    starts_at: string;
    ends_at: string;
};

function slotToMinutes(slot: string): number {
    const [hours, minutes] = slot.split(':').map(Number);
    return hours * 60 + minutes;
}

function minutesToSlot(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Group selections by court, sort chronologically, and merge contiguous
 * hourly slots into single runs so e.g. 9-10, 10-11, 11-12 become one
 * 9am-12pm booking instead of three separate hourly bookings. Slots step in
 * 60-minute increments from the day's opening time, so a venue opening at
 * 7:30 produces slots at 7:30, 8:30, 9:30, ... rather than snapping to :00.
 */
function buildBookingRuns(
    selections: SlotSelection[],
    selectedDate: string,
): BookingRun[] {
    const byCourt = new Map<number, SlotSelection[]>();

    for (const selection of selections) {
        const group = byCourt.get(selection.courtId) ?? [];
        group.push(selection);
        byCourt.set(selection.courtId, group);
    }

    const runs: BookingRun[] = [];

    for (const [courtId, group] of byCourt) {
        const sorted = [...group].sort(
            (a, b) => slotToMinutes(a.slot) - slotToMinutes(b.slot),
        );

        let runStart: number | null = null;
        let runEnd: number | null = null;

        const flushRun = () => {
            if (runStart === null || runEnd === null) {
                return;
            }

            runs.push({
                resource_id: courtId,
                starts_at: `${selectedDate} ${minutesToSlot(runStart)}:00`,
                ends_at: `${selectedDate} ${minutesToSlot(runEnd)}:00`,
            });
        };

        for (const selection of sorted) {
            const start = slotToMinutes(selection.slot);

            if (runStart === null) {
                runStart = start;
                runEnd = start + 60;
                continue;
            }

            if (start === runEnd) {
                runEnd = start + 60;
                continue;
            }

            flushRun();
            runStart = start;
            runEnd = start + 60;
        }

        flushRun();
    }

    return runs;
}

function generateTimeSlots(open: string, close: string): string[] {
    const openMinutes = slotToMinutes(open);
    const closeMinutes = slotToMinutes(close);
    const slots: string[] = [];

    for (let start = openMinutes; start + 60 <= closeMinutes; start += 60) {
        slots.push(minutesToSlot(start));
    }

    return slots;
}

function slotIsBooked(
    courtId: number,
    date: string,
    slot: string,
    bookedSlots: BookedSlot[],
): boolean {
    const slotStart = new Date(`${date}T${slot}:00`);
    const slotEnd = new Date(slotStart);
    slotEnd.setHours(slotEnd.getHours() + 1);

    return bookedSlots.some((booking) => {
        if (booking.resource_id !== courtId) {
            return false;
        }

        const bookingStart = parseISO(booking.starts_at);
        const bookingEnd = parseISO(booking.ends_at);

        return slotStart < bookingEnd && slotEnd > bookingStart;
    });
}

function slotIsBlocked(
    courtId: number,
    date: string,
    slot: string,
    scheduleBlocks: ScheduleBlock[],
): boolean {
    const slotStart = new Date(`${date}T${slot}:00`);
    const slotEnd = new Date(slotStart);
    slotEnd.setHours(slotEnd.getHours() + 1);

    return scheduleBlocks.some((block) => {
        if (block.resource_id !== null && block.resource_id !== courtId) {
            return false;
        }

        const blockStart = parseISO(block.starts_at);
        const blockEnd = parseISO(block.ends_at);

        return slotStart < blockEnd && slotEnd > blockStart;
    });
}

function slotIsPast(date: string, slot: string): boolean {
    const slotStart = new Date(`${date}T${slot}:00`);
    return slotStart <= new Date();
}

function slotIsRecurringLocked(
    courtId: number,
    date: string,
    slot: string,
    recurringLocks: RecurringScheduleLock[],
): boolean {
    const slotStart = slotToMinutes(slot);
    const slotEnd = slotStart + 60;
    const dayOfWeek = parseISO(`${date}T12:00:00`).getDay();

    return recurringLocks.some((lock) => {
        if (lock.resource_id !== null && lock.resource_id !== courtId) {
            return false;
        }

        if (lock.day_of_week !== dayOfWeek) {
            return false;
        }

        const lockStart = slotToMinutes(lock.starts_at);
        const lockEnd = slotToMinutes(lock.ends_at);

        return slotStart < lockEnd && slotEnd > lockStart;
    });
}

function formatSlotRange(slot: string): string {
    const startMinutes = slotToMinutes(slot);
    const endMinutes = startMinutes + 60;
    const pattern = startMinutes % 60 === 0 && endMinutes % 60 === 0 ? 'ha' : 'h:mma';
    const start = format(
        new Date().setHours(0, startMinutes, 0, 0),
        pattern,
    ).toUpperCase();
    const end = format(new Date().setHours(0, endMinutes, 0, 0), pattern).toUpperCase();

    return `${start}-${end}`;
}

function selectionKey(courtId: number, slot: string): string {
    return `${courtId}-${slot}`;
}

function capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

export function CourtScheduleGrid({
    courts,
    bookedSlots,
    scheduleBlocks = [],
    recurringLocks = [],
    dateOverrides = [],
    isAuthenticated,
    processing = false,
    errors,
    customer = null,
    markPaid = false,
}: Props) {
    const pageErrors = (usePage().props as { errors?: Record<string, string> }).errors ?? {};
    const effectiveErrors = errors ?? pageErrors;

    const today = format(new Date(), 'yyyy-MM-dd');
    const [selectedDate, setSelectedDate] = useState(today);
    const [selections, setSelections] = useState<SlotSelection[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [selectedSport, setSelectedSport] = useState<Resource['sport']>('pickleball');
    const [datePickerOpen, setDatePickerOpen] = useState(false);
    const [monthCursor, setMonthCursor] = useState(() =>
        startOfMonth(parseISO(`${today}T12:00:00`)),
    );

    const availableSports = useMemo(
        () => [...new Set(courts.map((court) => court.sport))],
        [courts],
    );

    const visibleCourts = useMemo(
        () => courts.filter((court) => court.sport === selectedSport),
        [courts, selectedSport],
    );

    const calendarDays = useMemo(() => {
        const gridStart = startOfWeek(startOfMonth(monthCursor));
        const gridEnd = endOfWeek(endOfMonth(monthCursor));

        return eachDayOfInterval({ start: gridStart, end: gridEnd });
    }, [monthCursor]);

    const overridesByDate = useMemo(() => {
        const map = new Map<string, DateOverride>();
        for (const override of dateOverrides) {
            map.set(override.date.split('T')[0], override);
        }
        return map;
    }, [dateOverrides]);

    const dateOverride = overridesByDate.get(selectedDate);
    // Dates are closed for booking unless an admin has explicitly opened them
    // with hours, so no override (or one still marked closed) means closed.
    const isOpenToday = dateOverride?.is_closed === false;
    const isClosedToday = !isOpenToday;
    const timeSlots =
        isOpenToday && dateOverride?.open_time && dateOverride?.close_time
            ? generateTimeSlots(dateOverride.open_time.slice(0, 5), dateOverride.close_time.slice(0, 5))
            : [];

    const selectedKeys = useMemo(
        () => new Set(selections.map((s) => selectionKey(s.courtId, s.slot))),
        [selections],
    );

    const toggleSlot = (court: Resource, slot: string) => {
        if (court.status !== 'available') {
            return;
        }

        if (slotIsBooked(court.id, selectedDate, slot, bookedSlots)) {
            return;
        }

        if (slotIsBlocked(court.id, selectedDate, slot, scheduleBlocks)) {
            return;
        }

        if (slotIsRecurringLocked(court.id, selectedDate, slot, recurringLocks)) {
            return;
        }

        if (slotIsPast(selectedDate, slot)) {
            return;
        }

        const key = selectionKey(court.id, slot);
        setSelections((current) => {
            const exists = current.some(
                (s) => selectionKey(s.courtId, s.slot) === key,
            );
            if (exists) {
                return current.filter(
                    (s) => selectionKey(s.courtId, s.slot) !== key,
                );
            }

            return [
                ...current,
                { courtId: court.id, courtName: court.name, slot },
            ];
        });
    };

    const clearSelections = () => setSelections([]);

    const selectDate = (dateStr: string) => {
        setSelectedDate(dateStr);
        setSelections([]);
        setDatePickerOpen(false);
        setMonthCursor(startOfMonth(parseISO(`${dateStr}T12:00:00`)));
    };

    const shiftDate = (direction: -1 | 1) => {
        const next =
            direction === 1
                ? addDays(parseISO(`${selectedDate}T12:00:00`), 1)
                : subDays(parseISO(`${selectedDate}T12:00:00`), 1);
        const nextStr = format(next, 'yyyy-MM-dd');

        if (nextStr < today) {
            return;
        }

        selectDate(nextStr);
    };

    const submitBookings = () => {
        if (!isAuthenticated) {
            router.visit(register());
            return;
        }

        if (!selections.length) {
            return;
        }

        const bookings = buildBookingRuns(selections, selectedDate);
        const requestOptions = {
            onStart: () => setSubmitting(true),
            onFinish: () => setSubmitting(false),
            onSuccess: () => setSelections([]),
        };

        if (customer) {
            router.post(
                storeWalkInBooking().url,
                { bookings, customer, mark_paid: markPaid },
                requestOptions,
            );
            return;
        }

        router.post(storeBookingsBulk().url, { bookings }, requestOptions);
    };

    const summary = selections
        .map((s) => `${s.courtName} ${formatSlotRange(s.slot)}`)
        .join(', ');

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 sm:gap-3">
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    onClick={() => shiftDate(-1)}
                    disabled={selectedDate <= today}
                    aria-label="Previous day"
                >
                    <ChevronLeft className="size-4" />
                </Button>
                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                    <PopoverTrigger asChild>
                        <button
                            type="button"
                            className="group flex min-w-0 flex-col items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-center transition-colors hover:border-brand-lime hover:bg-slate-50"
                        >
                            <span className="flex min-w-0 flex-wrap items-center justify-center gap-2 text-base font-bold text-brand-navy sm:text-lg md:text-xl">
                                <CalendarDays className="size-4 shrink-0 text-brand-court" />
                                {format(parseISO(`${selectedDate}T12:00:00`), 'EEEE, MMMM d, yyyy')}
                                <ChevronDown className="size-4 shrink-0 text-slate-400 transition-transform group-aria-expanded:rotate-180" />
                            </span>
                            <span className="text-xs font-medium text-brand-court underline underline-offset-2">
                                Choose a different date
                            </span>
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 max-w-[calc(100vw-2rem)]" align="center">
                        <div className="mb-2 flex items-center justify-between">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-7"
                                onClick={() => setMonthCursor((cursor) => subMonths(cursor, 1))}
                                disabled={
                                    format(monthCursor, 'yyyy-MM') <=
                                    format(parseISO(`${today}T12:00:00`), 'yyyy-MM')
                                }
                                aria-label="Previous month"
                            >
                                <ChevronLeft className="size-4" />
                            </Button>
                            <p className="text-sm font-semibold text-brand-navy">
                                {format(monthCursor, 'MMMM yyyy')}
                            </p>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-7"
                                onClick={() => setMonthCursor((cursor) => addMonths(cursor, 1))}
                                aria-label="Next month"
                            >
                                <ChevronRight className="size-4" />
                            </Button>
                        </div>

                        <div className="grid grid-cols-7 gap-y-1 text-center text-[10px] font-medium text-slate-400">
                            {WEEKDAYS.map((weekday) => (
                                <div key={weekday}>{weekday}</div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-y-1">
                            {calendarDays.map((day) => {
                                const dateStr = format(day, 'yyyy-MM-dd');
                                const inMonth = isSameMonth(day, monthCursor);
                                const isPast = dateStr < today;
                                const dayOverride = overridesByDate.get(dateStr);
                                const isOpenDate = dayOverride?.is_closed === false;
                                const isSelected = dateStr === selectedDate;

                                return (
                                    <button
                                        key={dateStr}
                                        type="button"
                                        disabled={isPast}
                                        onClick={() => selectDate(dateStr)}
                                        className={cn(
                                            'mx-auto flex size-9 flex-col items-center justify-center gap-0.5 rounded-md text-xs transition-colors',
                                            !inMonth && 'text-slate-300',
                                            isPast && 'cursor-not-allowed text-slate-300',
                                            !isPast &&
                                                inMonth &&
                                                'text-brand-navy hover:bg-slate-100',
                                            isSelected &&
                                                'bg-brand-lime/25 ring-1 ring-brand-lime',
                                        )}
                                    >
                                        <span className="font-semibold">{format(day, 'd')}</span>
                                        {!isPast && (
                                            <span
                                                className={cn(
                                                    'size-1.5 rounded-full',
                                                    isOpenDate
                                                        ? 'bg-emerald-500'
                                                        : 'bg-slate-300',
                                                )}
                                            />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-3 flex items-center gap-3 border-t border-slate-100 pt-2 text-[10px] text-slate-500">
                            <span className="flex items-center gap-1">
                                <span className="size-1.5 rounded-full bg-emerald-500" />
                                Open
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="size-1.5 rounded-full bg-slate-300" />
                                Closed
                            </span>
                        </div>
                    </PopoverContent>
                </Popover>
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    onClick={() => shiftDate(1)}
                    aria-label="Next day"
                >
                    <ChevronRight className="size-4" />
                </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <Badge
                    variant="secondary"
                    className="bg-sky-100 text-sky-800 uppercase"
                >
                    {isAuthenticated ? 'Member' : 'Non-member'}
                </Badge>
            </div>

            <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-600">
                <span className="flex items-center gap-2">
                    <span className="size-4 rounded border border-emerald-200 bg-emerald-50" />
                    Open
                </span>
                <span className="flex items-center gap-2">
                    <span className="size-4 rounded border border-brand-lime bg-brand-lime/30" />
                    Selected
                </span>
                <span className="flex items-center gap-2">
                    <span className="size-4 rounded border border-slate-200 bg-slate-100" />
                    Booked
                </span>
                <span className="flex items-center gap-2">
                    <span className="size-4 rounded border border-slate-300 bg-slate-200" />
                    Locked
                </span>
            </div>

            {availableSports.length > 1 && (
                <ToggleGroup
                    type="single"
                    variant="outline"
                    value={selectedSport}
                    onValueChange={(value) => {
                        if (!value) {
                            return;
                        }
                        setSelectedSport(value as Resource['sport']);
                        setSelections([]);
                    }}
                >
                    {availableSports.map((sport) => (
                        <ToggleGroupItem key={sport} value={sport}>
                            {capitalize(sport)}
                        </ToggleGroupItem>
                    ))}
                </ToggleGroup>
            )}

            {isClosedToday ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-medium text-slate-500">
                    <p>
                        Bookings are closed on{' '}
                        {format(parseISO(`${selectedDate}T12:00:00`), 'EEEE, MMMM d')}
                    </p>
                    {dateOverride?.reason && (
                        <p className="mt-1 text-xs font-normal text-slate-400">
                            {dateOverride.reason}
                        </p>
                    )}
                </div>
            ) : visibleCourts.length === 0 ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-medium text-slate-500">
                    No {selectedSport} {selectedSport === 'billiards' ? 'tables' : 'courts'} available
                </div>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full min-w-[32rem] border-collapse text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50">
                                <th className="px-3 py-3 text-left font-semibold text-slate-700">
                                    Time
                                </th>
                                {visibleCourts.map((court) => {
                                    const unavailable = court.status !== 'available';

                                    return (
                                        <th
                                            key={court.id}
                                            className="px-3 py-3 text-center font-semibold text-slate-700"
                                        >
                                            {court.name}
                                            {unavailable ? (
                                                <Badge
                                                    variant="secondary"
                                                    className="mt-0.5 block w-fit bg-amber-100 text-amber-800 uppercase"
                                                >
                                                    {court.status === 'maintenance'
                                                        ? 'Maintenance'
                                                        : 'Unavailable'}
                                                </Badge>
                                            ) : (
                                                <span className="mt-0.5 block text-xs font-normal text-slate-500">
                                                    {capitalize(court.sport)}
                                                </span>
                                            )}
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {timeSlots.map((slot) => (
                                <tr
                                    key={slot}
                                    className="border-b border-slate-100 last:border-0"
                                >
                                    <td className="px-3 py-2 font-medium whitespace-nowrap text-slate-600">
                                        {formatSlotRange(slot)}
                                    </td>
                                    {visibleCourts.map((court) => {
                                        const unavailable = court.status !== 'available';
                                        const booked = slotIsBooked(
                                            court.id,
                                            selectedDate,
                                            slot,
                                            bookedSlots,
                                        );
                                        const blocked = slotIsBlocked(
                                            court.id,
                                            selectedDate,
                                            slot,
                                            scheduleBlocks,
                                        );
                                        const locked = slotIsRecurringLocked(
                                            court.id,
                                            selectedDate,
                                            slot,
                                            recurringLocks,
                                        );
                                        const past = slotIsPast(selectedDate, slot);
                                        const selected = selectedKeys.has(
                                            selectionKey(court.id, slot),
                                        );
                                        const disabled =
                                            unavailable || booked || blocked || locked || past;

                                        return (
                                            <td key={court.id} className="p-1">
                                                <button
                                                    type="button"
                                                    disabled={disabled}
                                                    onClick={() =>
                                                        toggleSlot(court, slot)
                                                    }
                                                    className={cn(
                                                        'w-full rounded px-2 py-2.5 text-center text-xs font-semibold transition-colors sm:text-sm',
                                                        disabled &&
                                                            'cursor-not-allowed bg-slate-100 text-slate-400',
                                                        (blocked || locked || unavailable || past) &&
                                                            !booked &&
                                                            'bg-slate-200 text-slate-500',
                                                        !disabled &&
                                                            selected &&
                                                            'bg-brand-lime/35 text-brand-navy ring-1 ring-brand-lime',
                                                        !disabled &&
                                                            !selected &&
                                                            'bg-emerald-50 text-emerald-700 hover:bg-brand-lime/20',
                                                    )}
                                                >
                                                    {booked
                                                        ? 'Booked'
                                                        : unavailable
                                                          ? 'Unavailable'
                                                          : past
                                                            ? 'Passed'
                                                            : locked
                                                              ? 'Locked'
                                                              : blocked
                                                                ? 'Blocked'
                                                                : selected
                                                                  ? 'Selected'
                                                                  : 'Open'}
                                                </button>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {(effectiveErrors.bookings || effectiveErrors['bookings.0.starts_at'] || effectiveErrors.starts_at) && (
                <p className="text-destructive text-sm">
                    {effectiveErrors.bookings ?? effectiveErrors['bookings.0.starts_at'] ?? effectiveErrors.starts_at}
                </p>
            )}

            <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500 sm:text-sm">
                    {selections.length
                        ? summary
                        : 'Tap open slots to select courts and times'}
                </p>
                <div className="flex shrink-0 gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={clearSelections}
                        disabled={!selections.length || processing || submitting}
                    >
                        Clear
                    </Button>
                    <Button
                        type="button"
                        onClick={submitBookings}
                        disabled={!selections.length || processing || submitting}
                        className="bg-brand-lime font-bold text-brand-navy hover:bg-brand-lime-dark"
                    >
                        {isAuthenticated ? (submitting ? 'Booking…' : 'Book now') : 'Sign up to book'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
