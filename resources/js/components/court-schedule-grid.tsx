import { Link, router, usePage } from '@inertiajs/react';
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
import { WeatherIcon } from '@/components/weather-icon';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { register } from '@/routes';
import { storeBulk as storeBookingsBulk, storeWalkIn as storeWalkInBooking } from '@/routes/bookings';
import { join as joinOpenPlay } from '@/routes/open-play';
import type {
    BookedSlot,
    DateOverride,
    HourForecast,
    Resource,
} from '@/types/booking';

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
    dateOverrides?: DateOverride[];
    isAuthenticated: boolean;
    processing?: boolean;
    errors?: Record<string, string>;
    customer?: WalkInCustomerPayload | null;
    markPaid?: boolean;
    /**
     * Reschedule mode: force every selection to snap to a contiguous run of
     * `slotCount` hourly slots (matching the original booking's duration)
     * starting at the clicked slot, and hand the resulting single run to
     * `onSubmit` instead of posting to the bulk/walk-in booking endpoints.
     * Pass a single-court `courts` array alongside this to keep the picker
     * scoped to the court being rescheduled.
     */
    slotCount?: number;
    onSubmit?: (run: BookingRun, options: { onStart: () => void; onFinish: () => void; onSuccess: () => void }) => void;
    submitLabel?: string;
    /** Keyed by "Y-m-d H:00". Covers the next 7 days; other dates show nothing. */
    hourlyWeather?: Record<string, HourForecast>;
};

export type BookingRun = {
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

function findBookedSlot(
    courtId: number,
    date: string,
    slot: string,
    bookedSlots: BookedSlot[],
): BookedSlot | undefined {
    const slotStart = new Date(`${date}T${slot}:00`);
    const slotEnd = new Date(slotStart);
    slotEnd.setHours(slotEnd.getHours() + 1);

    return bookedSlots.find((booking) => {
        if (booking.resource_id !== courtId) {
            return false;
        }

        const bookingStart = parseISO(booking.starts_at);
        const bookingEnd = parseISO(booking.ends_at);

        return slotStart < bookingEnd && slotEnd > bookingStart;
    });
}

function isOpenPlaySlot(bookedSlot: BookedSlot | undefined): boolean {
    return typeof bookedSlot?.id === 'string' && bookedSlot.id.startsWith('open-play-');
}

/**
 * Open Play slot ids are formatted as "open-play-{sessionId}-{resourceId}"
 * (see ResourceBookingService::getOpenPlayBookedSlots) — pull the session id
 * back out so the cell can link to that session.
 */
function openPlaySessionId(bookedSlot: BookedSlot | undefined): number | null {
    if (typeof bookedSlot?.id !== 'string') {
        return null;
    }

    const match = bookedSlot.id.match(/^open-play-(\d+)-\d+$/);
    return match ? Number(match[1]) : null;
}

function slotIsPast(date: string, slot: string): boolean {
    const slotStart = new Date(`${date}T${slot}:00`);
    return slotStart <= new Date();
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

/**
 * Forecast for one slot's hour, shown under the time label. Renders nothing
 * outside the 7-day hourly window rather than leaving a gap placeholder.
 */
function SlotWeather({ forecast }: { forecast?: HourForecast }) {
    if (!forecast) {
        return null;
    }

    return (
        <span
            className="mt-0.5 flex items-center gap-1 text-[11px] font-normal text-slate-500"
            title={`${forecast.label} · ${forecast.temp}° · ${forecast.precipitation}% chance of rain`}
        >
            <WeatherIcon icon={forecast.icon} className="size-3.5" />
            <span className="tabular-nums">{forecast.temp}°</span>
            {/* Only shown once rain is actually likely for that hour. */}
            {forecast.precipitation >= 40 && (
                <span className="text-sky-600 tabular-nums">
                    {forecast.precipitation}%
                </span>
            )}
        </span>
    );
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
    dateOverrides = [],
    isAuthenticated,
    processing = false,
    errors,
    customer = null,
    markPaid = false,
    slotCount,
    onSubmit,
    submitLabel,
    hourlyWeather = {},
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

        if (findBookedSlot(court.id, selectedDate, slot, bookedSlots)) {
            return;
        }

        if (slotIsPast(selectedDate, slot)) {
            return;
        }

        if (slotCount && slotCount > 1) {
            const key = selectionKey(court.id, slot);
            const alreadySelected = selections.some(
                (s) => selectionKey(s.courtId, s.slot) === key,
            );

            if (alreadySelected) {
                setSelections([]);
                return;
            }

            const startMinutes = slotToMinutes(slot);
            const run: SlotSelection[] = [];

            for (let i = 0; i < slotCount; i++) {
                const runSlot = minutesToSlot(startMinutes + i * 60);

                if (
                    !timeSlots.includes(runSlot) ||
                    findBookedSlot(court.id, selectedDate, runSlot, bookedSlots) ||
                    slotIsPast(selectedDate, runSlot)
                ) {
                    return;
                }

                run.push({ courtId: court.id, courtName: court.name, slot: runSlot });
            }

            setSelections(run);
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

        if (onSubmit) {
            onSubmit(bookings[0], requestOptions);
            return;
        }

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
                    <span className="size-4 rounded border border-slate-300 bg-slate-200" />
                    Booked
                </span>
                <span className="flex items-center gap-2">
                    <span className="size-4 rounded border border-violet-200 bg-violet-100" />
                    Open Play
                </span>
                <span className="flex items-center gap-2">
                    <span className="size-4 rounded border border-amber-200 bg-amber-50" />
                    Unavailable
                </span>
                <span className="flex items-center gap-2">
                    <span className="size-4 rounded border border-rose-200 bg-rose-50" />
                    Passed
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
                                    <td className="px-3 py-2 whitespace-nowrap text-slate-600">
                                        <span className="font-medium">
                                            {formatSlotRange(slot)}
                                        </span>
                                        <SlotWeather
                                            forecast={
                                                hourlyWeather[
                                                    `${selectedDate} ${slot.slice(0, 2)}:00`
                                                ]
                                            }
                                        />
                                    </td>
                                    {visibleCourts.map((court) => {
                                        const unavailable = court.status !== 'available';
                                        const bookedSlot = findBookedSlot(
                                            court.id,
                                            selectedDate,
                                            slot,
                                            bookedSlots,
                                        );
                                        const booked = !!bookedSlot;
                                        const openPlay = isOpenPlaySlot(bookedSlot);
                                        const sessionId = openPlaySessionId(bookedSlot);
                                        const past = slotIsPast(selectedDate, slot);
                                        const selected = selectedKeys.has(
                                            selectionKey(court.id, slot),
                                        );
                                        const disabled =
                                            unavailable || (booked && !openPlay) || past;
                                        const cellLabel = booked
                                            ? openPlay
                                                ? 'Open Play'
                                                : 'Booked'
                                            : unavailable
                                              ? 'Unavailable'
                                              : past
                                                ? 'Passed'
                                                : selected
                                                  ? 'Selected'
                                                  : 'Open';
                                        const cellClassName = cn(
                                            'block w-full rounded px-2 py-2.5 text-center text-xs font-semibold transition-colors sm:text-sm',
                                            disabled && 'cursor-not-allowed',
                                            booked &&
                                                openPlay &&
                                                'bg-violet-100 text-violet-700 hover:bg-violet-200',
                                            booked &&
                                                !openPlay &&
                                                'bg-slate-200 text-slate-500',
                                            !booked &&
                                                unavailable &&
                                                'border border-amber-200 bg-amber-50 text-amber-600',
                                            !booked &&
                                                !unavailable &&
                                                past &&
                                                'border border-rose-200 bg-rose-50 text-rose-500',
                                            !disabled &&
                                                !openPlay &&
                                                selected &&
                                                'bg-brand-lime/35 text-brand-navy ring-1 ring-brand-lime',
                                            !disabled &&
                                                !openPlay &&
                                                !selected &&
                                                'bg-emerald-50 text-emerald-700 hover:bg-brand-lime/20',
                                        );

                                        return (
                                            <td key={court.id} className="p-1">
                                                {openPlay && sessionId ? (
                                                    <Link
                                                        href={joinOpenPlay(sessionId)}
                                                        title="Join this Open Play session"
                                                        className={cellClassName}
                                                    >
                                                        {cellLabel}
                                                    </Link>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        disabled={disabled}
                                                        onClick={() =>
                                                            toggleSlot(court, slot)
                                                        }
                                                        className={cellClassName}
                                                    >
                                                        {cellLabel}
                                                    </button>
                                                )}
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
                        {isAuthenticated
                            ? submitting
                                ? `${submitLabel ?? 'Book now'}…`
                                : (submitLabel ?? 'Book now')
                            : 'Sign up to book'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
