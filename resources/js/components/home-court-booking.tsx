import { Link, router, usePage } from '@inertiajs/react';
import { addDays, format, parseISO, subDays } from 'date-fns';
import {
    Ban,
    CalendarDays,
    Check,
    ChevronLeft,
    ChevronRight,
    Circle,
    Hourglass,
    Info,
    LandPlot,
    Lock,
    Users,
} from 'lucide-react';
import type { LucideIcon, LucideProps } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ComponentType } from 'react';

import { BookingCalendar, SlotWeather } from '@/components/court-schedule-grid';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useHoldReleaseRefresh } from '@/hooks/use-hold-release-refresh';
import {
    buildBookingRuns,
    findBookedSlot,
    formatSlotRange,
    generateTimeSlots,
    pendingPaymentInfo,
    isOpenPlaySlot,
    nearestOpenDate,
    openPlaySessionId,
    selectionKey,
    slotIsPast,
} from '@/lib/court-schedule';
import type { SlotSelection } from '@/lib/court-schedule';
import { formatClock } from '@/lib/format';
import { compareSports, sportLabel, sportUnit } from '@/lib/sport';
import { cn } from '@/lib/utils';
import { register } from '@/routes';
import { storeBulk as storeBookingsBulk } from '@/routes/bookings';
import { join as joinOpenPlay } from '@/routes/open-play';
import type { BookedSlot, DateOverride, HourForecast, Resource } from '@/types/booking';

/**
 * The home page's court booking, split across two cards (the schedule and a
 * separate summary column) so both read from this one hook. Slot rules come
 * from lib/court-schedule, the same as the member booking grid; the server
 * re-checks every booking, so this is only the picker.
 */
export function useCourtBooking({
    courts,
    bookedSlots,
    dateOverrides,
    isAuthenticated,
}: {
    courts: Resource[];
    bookedSlots: BookedSlot[];
    dateOverrides: DateOverride[];
    isAuthenticated: boolean;
}) {
    const today = format(new Date(), 'yyyy-MM-dd');
    const [selectedDate, setSelectedDate] = useState(() => nearestOpenDate(dateOverrides, today));
    const [selections, setSelections] = useState<SlotSelection[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [datePickerOpen, setDatePickerOpen] = useState(false);
    const [courtFilter, setCourtFilter] = useState<number | 'all'>('all');

    useHoldReleaseRefresh(bookedSlots);

    // Only sports the venue has resources for get a tab, in enum order.
    const sports = useMemo(
        () => [...new Set(courts.map((court) => court.sport))].sort(compareSports),
        [courts],
    );
    const [sport, setSportState] = useState<Resource['sport']>(
        () => sports[0] ?? 'pickleball',
    );

    const sportCourts = useMemo(
        () => courts.filter((court) => court.sport === sport),
        [courts, sport],
    );
    const visibleCourts =
        courtFilter === 'all'
            ? sportCourts
            : sportCourts.filter((court) => court.id === courtFilter);

    const overridesByDate = useMemo(() => {
        const map = new Map<string, DateOverride>();

        for (const override of dateOverrides) {
            map.set(override.date.split('T')[0], override);
        }

        return map;
    }, [dateOverrides]);

    // Dates are closed unless an admin has explicitly opened them with hours.
    const dateOverride = overridesByDate.get(selectedDate);
    const isOpen = dateOverride?.is_closed === false;
    const timeSlots =
        isOpen && dateOverride?.open_time && dateOverride?.close_time
            ? generateTimeSlots(
                  dateOverride.open_time.slice(0, 5),
                  dateOverride.close_time.slice(0, 5),
              )
            : [];

    const selectedKeys = useMemo(
        () => new Set(selections.map((s) => selectionKey(s.courtId, s.slot))),
        [selections],
    );

    const selectDate = (date: string) => {
        setSelectedDate(date);
        setSelections([]);
        setDatePickerOpen(false);
    };

    const shiftDate = (direction: -1 | 1) => {
        const base = parseISO(`${selectedDate}T12:00:00`);
        const next = format(direction === 1 ? addDays(base, 1) : subDays(base, 1), 'yyyy-MM-dd');

        if (next >= today) {
            selectDate(next);
        }
    };

    const setSport = (value: Resource['sport']) => {
        setSportState(value);
        setCourtFilter('all');
        setSelections([]);
    };

    const toggleSlot = (court: Resource, slot: string) => {
        if (
            court.status !== 'available' ||
            findBookedSlot(court.id, selectedDate, slot, bookedSlots) ||
            slotIsPast(selectedDate, slot)
        ) {
            return;
        }

        const key = selectionKey(court.id, slot);

        setSelections((current) =>
            current.some((s) => selectionKey(s.courtId, s.slot) === key)
                ? current.filter((s) => selectionKey(s.courtId, s.slot) !== key)
                : [...current, { courtId: court.id, courtName: court.name, slot }],
        );
    };

    const runs = buildBookingRuns(selections, selectedDate);

    const submit = () => {
        if (!isAuthenticated) {
            router.visit(register());

            return;
        }

        if (!runs.length) {
            return;
        }

        router.post(
            storeBookingsBulk().url,
            { bookings: runs },
            {
                onStart: () => setSubmitting(true),
                onFinish: () => setSubmitting(false),
                onSuccess: () => setSelections([]),
            },
        );
    };

    return {
        today,
        selectedDate,
        selectDate,
        shiftDate,
        datePickerOpen,
        setDatePickerOpen,
        overridesByDate,
        dateOverride,
        isOpen,
        timeSlots,
        sports,
        sport,
        setSport,
        sportCourts,
        visibleCourts,
        courtFilter,
        setCourtFilter,
        bookedSlots,
        selections,
        selectedKeys,
        toggleSlot,
        clear: () => setSelections([]),
        runs,
        submit,
        submitting,
        isAuthenticated,
    };
}

export type CourtBooking = ReturnType<typeof useCourtBooking>;

type CellState = 'available' | 'selected' | 'passed' | 'booked' | 'awaiting-payment' | 'open-play' | 'unavailable';

const cellStyles: Record<CellState, { label: string; icon: LucideIcon; className: string }> = {
    available: {
        label: 'Available',
        icon: Circle,
        className: 'bg-emerald-50 text-emerald-700 ring-emerald-100 hover:bg-brand-lime/30',
    },
    selected: {
        label: 'Selected',
        icon: Check,
        className: 'bg-brand-lime text-brand-navy ring-brand-lime-dark',
    },
    passed: {
        label: 'Passed',
        icon: Circle,
        className: 'cursor-not-allowed bg-rose-50 text-rose-600 ring-rose-100 [&_svg]:fill-current',
    },
    booked: {
        label: 'Booked',
        icon: Lock,
        className: 'cursor-not-allowed bg-slate-100 text-slate-500 ring-slate-200',
    },
    'awaiting-payment': {
        label: 'Awaiting payment',
        icon: Hourglass,
        className: 'cursor-not-allowed border border-dashed border-orange-300 bg-orange-50 text-orange-700 ring-0',
    },
    'open-play': {
        label: 'Open Play',
        icon: Users,
        className: 'bg-violet-50 text-violet-700 ring-violet-100 hover:bg-violet-100',
    },
    unavailable: {
        label: 'Unavailable',
        icon: Ban,
        className: 'cursor-not-allowed bg-slate-100 text-slate-400 ring-slate-200',
    },
};

function SlotCell({
    booking,
    court,
    slot,
}: {
    booking: CourtBooking;
    court: Resource;
    slot: string;
}) {
    const bookedSlot = findBookedSlot(court.id, booking.selectedDate, slot, booking.bookedSlots);
    const sessionId = openPlaySessionId(bookedSlot);
    const pending = pendingPaymentInfo(bookedSlot);
    const state: CellState = bookedSlot
        ? isOpenPlaySlot(bookedSlot)
            ? 'open-play'
            : pending
              ? 'awaiting-payment'
              : 'booked'
        : court.status !== 'available'
          ? 'unavailable'
          : slotIsPast(booking.selectedDate, slot)
            ? 'passed'
            : booking.selectedKeys.has(selectionKey(court.id, slot))
              ? 'selected'
              : 'available';
    const { label, icon: Icon, className } = cellStyles[state];
    const classes = cn(
        'flex w-full items-center justify-center gap-1 rounded-md px-1.5 py-2 text-[11px] font-semibold whitespace-nowrap ring-1 transition-colors',
        className,
    );
    const content =
        state === 'awaiting-payment' && pending ? (
            <span className="flex flex-col items-center leading-tight">
                <span className="flex items-center gap-1">
                    <Icon className="size-3 shrink-0" />
                    {label}
                </span>
                <span className="text-[10px] font-medium opacity-80">{pending.short}</span>
            </span>
        ) : (
            <>
                <Icon className="size-3 shrink-0" />
                {label}
            </>
        );

    if (state === 'open-play' && sessionId) {
        return (
            <Link href={joinOpenPlay(sessionId)} title="Join this Open Play session" className={classes}>
                {content}
            </Link>
        );
    }

    return (
        <button
            type="button"
            disabled={state !== 'available' && state !== 'selected'}
            onClick={() => booking.toggleSlot(court, slot)}
            aria-pressed={state === 'selected'}
            aria-label={`${court.name}, ${formatSlotRange(slot)}: ${pending ? pending.explanation : label}`}
            title={pending?.explanation}
            className={classes}
        >
            {content}
        </button>
    );
}

/** Icon + title row shared by the home page's tab panels. */
export function PanelTitle({
    icon: Icon,
    title,
    subtitle,
}: {
    icon: ComponentType<LucideProps>;
    title: string;
    subtitle?: string;
}) {
    return (
        <div className="flex items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-slate-100 text-brand-navy">
                <Icon className="size-6" />
            </span>
            <div className="min-w-0">
                <h2 className="text-xl font-bold text-brand-navy sm:text-2xl">{title}</h2>
                {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
            </div>
        </div>
    );
}

export function BookYourCourt({
    booking,
    hourlyWeather = {},
}: {
    booking: CourtBooking;
    hourlyWeather?: Record<string, HourForecast>;
}) {
    const dateLabel = format(parseISO(`${booking.selectedDate}T12:00:00`), 'EEEE, MMMM d, yyyy');
    const unit = sportUnit(booking.sport);

    return (
        <div>
            <PanelTitle
                icon={CalendarDays}
                title={`Book Your ${unit === 'courts' ? 'Court' : sportLabel(booking.sport)}`}
                subtitle="Select a date, time and court to reserve your spot."
            />

            {booking.sports.length > 1 && (
                <div className="mt-5 flex gap-1 rounded-xl bg-slate-100 p-1">
                    {booking.sports.map((sport) => (
                        <button
                            key={sport}
                            type="button"
                            onClick={() => booking.setSport(sport)}
                            className={cn(
                                'flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors sm:text-sm',
                                booking.sport === sport
                                    ? 'bg-white text-brand-navy shadow-sm'
                                    : 'text-slate-500 hover:text-brand-navy',
                            )}
                        >
                            {sportLabel(sport)}
                        </button>
                    ))}
                </div>
            )}

            <div className="mt-5 flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 sm:px-4">
                <Popover open={booking.datePickerOpen} onOpenChange={booking.setDatePickerOpen}>
                    <PopoverTrigger asChild>
                        <button
                            type="button"
                            className="flex min-w-0 flex-1 items-center gap-3 rounded-md py-1 text-left text-sm font-bold text-brand-navy sm:text-base"
                        >
                            <CalendarDays className="size-5 shrink-0" />
                            <span className="truncate">{dateLabel}</span>
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 max-w-[calc(100vw-2rem)]" align="start">
                        <BookingCalendar
                            today={booking.today}
                            selectedDate={booking.selectedDate}
                            overridesByDate={booking.overridesByDate}
                            onSelect={booking.selectDate}
                        />
                    </PopoverContent>
                </Popover>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => booking.shiftDate(-1)}
                    disabled={booking.selectedDate <= booking.today}
                    aria-label="Previous day"
                >
                    <ChevronLeft className="size-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => booking.shiftDate(1)}
                    aria-label="Next day"
                >
                    <ChevronRight className="size-4" />
                </Button>
            </div>

            {booking.sportCourts.length > 0 && (
                <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-2">
                    {booking.sportCourts.map((court) => {
                        const active = booking.courtFilter === court.id;
                        const available = court.status === 'available';

                        return (
                            <button
                                key={court.id}
                                type="button"
                                onClick={() => booking.setCourtFilter(active ? 'all' : court.id)}
                                aria-pressed={active}
                                className={cn(
                                    'relative flex flex-col items-center gap-1 rounded-xl border bg-white px-2 py-3 text-center transition-colors',
                                    active
                                        ? 'border-emerald-600 ring-1 ring-emerald-600'
                                        : 'border-slate-200 hover:border-emerald-500',
                                )}
                            >
                                <span
                                    className={cn(
                                        'absolute top-2 right-2 size-2 rounded-full',
                                        available ? 'bg-emerald-500' : 'bg-slate-300',
                                    )}
                                    title={available ? 'Available' : 'Unavailable'}
                                />
                                <LandPlot className="size-6 text-brand-navy" />
                                <span className="line-clamp-2 text-xs font-semibold text-brand-navy">
                                    {court.name}
                                </span>
                                <span className="text-[11px] text-slate-500 capitalize">
                                    {available ? court.location_type : court.status}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}

            <div className="mt-5">
                {!booking.isOpen ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm font-medium text-slate-500">
                        <p>
                            Bookings are closed on{' '}
                            {format(parseISO(`${booking.selectedDate}T12:00:00`), 'EEEE, MMMM d')}.
                        </p>
                        <p className="mt-1 text-xs font-normal text-slate-400">
                            {booking.dateOverride?.reason ?? 'Try another date — open dates have a green dot in the calendar.'}
                        </p>
                    </div>
                ) : booking.visibleCourts.length === 0 ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm font-medium text-slate-500">
                        No {sportLabel(booking.sport).toLowerCase()} {unit} available
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full border-collapse text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-brand-navy">
                                    <th className="sticky left-0 z-10 bg-slate-50 px-3 py-3">Time</th>
                                    {booking.visibleCourts.map((court) => (
                                        <th key={court.id} className="min-w-24 px-1.5 py-3 font-semibold">
                                            {court.name}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {booking.timeSlots.map((slot) => (
                                    <tr key={slot} className="border-b border-slate-100 last:border-0">
                                        <td className="sticky left-0 z-10 bg-white px-3 py-1.5 text-xs whitespace-nowrap text-brand-navy">
                                            <span className="font-medium">{formatSlotRange(slot)}</span>
                                            <SlotWeather
                                                forecast={hourlyWeather[`${booking.selectedDate} ${slot.slice(0, 2)}:00`]}
                                            />
                                        </td>
                                        {booking.visibleCourts.map((court) => (
                                            <td key={court.id} className="px-1 py-1.5">
                                                <SlotCell booking={booking} court={court} slot={slot} />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <BookingBar booking={booking} />

            <p className="mt-4 flex items-center gap-2.5 rounded-xl bg-lime-50 px-4 py-3 text-xs text-brand-navy ring-1 ring-lime-100">
                <Info className="size-4 shrink-0 text-emerald-600" />
                &ldquo;Awaiting payment&rdquo; means another customer is still paying for that slot. If they
                don&apos;t finish in time, it becomes available at the time shown.
            </p>
        </div>
    );
}

/** Selected slots and the book button, under the schedule. */
function BookingBar({ booking }: { booking: CourtBooking }) {
    const { errors = {} } = usePage().props as { errors?: Record<string, string> };
    const error = errors.bookings ?? errors['bookings.0.starts_at'] ?? errors.starts_at;
    const courtNames = new Map(booking.sportCourts.map((court) => [court.id, court.name]));
    const hours = booking.selections.length;
    const summary = booking.runs
        .map(
            (run) =>
                `${courtNames.get(run.resource_id) ?? 'Court'} · ${formatClock(run.starts_at.slice(11, 16))} – ${formatClock(run.ends_at.slice(11, 16))}`,
        )
        .join(', ');

    return (
        <div className="mt-4 rounded-xl border border-slate-200 p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 text-xs">
                    <p className="font-semibold text-brand-navy">
                        {hours
                            ? `${hours} ${hours === 1 ? 'hour' : 'hours'} selected`
                            : 'No time selected'}
                    </p>
                    <p className="mt-0.5 text-slate-500">
                        {summary || 'Tap an available slot to choose your court and time.'}
                    </p>
                </div>
                <div className="flex shrink-0 gap-2">
                    {hours > 0 && (
                        <Button
                            type="button"
                            variant="outline"
                            className="h-11 rounded-xl"
                            onClick={booking.clear}
                            disabled={booking.submitting}
                        >
                            Clear
                        </Button>
                    )}
                    <Button
                        type="button"
                        onClick={booking.submit}
                        disabled={!hours || booking.submitting}
                        className="h-11 flex-1 rounded-xl bg-brand-lime px-6 font-bold text-brand-navy hover:bg-brand-lime-dark disabled:bg-lime-100 disabled:text-slate-400 disabled:opacity-100 sm:flex-none"
                    >
                        {!booking.isAuthenticated ? 'Sign up to book' : booking.submitting ? 'Booking…' : 'Book Now'}
                    </Button>
                </div>
            </div>
            {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
        </div>
    );
}
