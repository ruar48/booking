import { router } from '@inertiajs/react';
import { addDays, format, parseISO, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { register } from '@/routes';
import { storeBulk as storeBookingsBulk } from '@/routes/bookings';
import type { BookedSlot, Club, Resource } from '@/types/booking';

const BOOKING_WINDOW_DAYS = 9;

type SlotSelection = {
    courtId: number;
    courtName: string;
    slot: string;
};

type Props = {
    courts: Resource[];
    club: Club | null;
    bookedSlots: BookedSlot[];
    isAuthenticated: boolean;
    processing?: boolean;
    errors?: Record<string, string>;
};

function generateTimeSlots(open: string, close: string): string[] {
    const [openHour] = open.split(':').map(Number);
    const [closeHour] = close.split(':').map(Number);
    const slots: string[] = [];

    for (let hour = openHour; hour < closeHour; hour++) {
        slots.push(`${String(hour).padStart(2, '0')}:00`);
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

function formatSlotRange(slot: string): string {
    const hour = Number(slot.split(':')[0]);
    const start = format(new Date().setHours(hour, 0, 0, 0), 'ha').toUpperCase();
    const end = format(new Date().setHours(hour + 1, 0, 0, 0), 'ha').toUpperCase();

    return `${start}-${end}`;
}

function selectionKey(courtId: number, slot: string): string {
    return `${courtId}-${slot}`;
}

export function CourtScheduleGrid({
    courts,
    club,
    bookedSlots,
    isAuthenticated,
    processing = false,
    errors = {},
}: Props) {
    const today = format(new Date(), 'yyyy-MM-dd');
    const maxDate = format(addDays(new Date(), BOOKING_WINDOW_DAYS), 'yyyy-MM-dd');
    const [selectedDate, setSelectedDate] = useState(today);
    const [selections, setSelections] = useState<SlotSelection[]>([]);

    const dayKey = format(
        parseISO(`${selectedDate}T12:00:00`),
        'EEEE',
    ).toLowerCase();
    const dayHours = club?.operating_hours?.[dayKey as keyof typeof club.operating_hours];
    const timeSlots = dayHours
        ? generateTimeSlots(dayHours.open, dayHours.close)
        : generateTimeSlots('07:00', '23:00');

    const bookingDeadline = format(
        addDays(new Date(), BOOKING_WINDOW_DAYS),
        'EEE, MMM d, yyyy',
    );

    const selectedKeys = useMemo(
        () => new Set(selections.map((s) => selectionKey(s.courtId, s.slot))),
        [selections],
    );

    const toggleSlot = (court: Resource, slot: string) => {
        if (slotIsBooked(court.id, selectedDate, slot, bookedSlots)) {
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

    const shiftDate = (direction: -1 | 1) => {
        const next =
            direction === 1
                ? addDays(parseISO(`${selectedDate}T12:00:00`), 1)
                : subDays(parseISO(`${selectedDate}T12:00:00`), 1);
        const nextStr = format(next, 'yyyy-MM-dd');

        if (nextStr < today || nextStr > maxDate) {
            return;
        }

        setSelectedDate(nextStr);
        setSelections([]);
    };

    const submitBookings = () => {
        if (!isAuthenticated) {
            router.visit(register());
            return;
        }

        if (!selections.length) {
            return;
        }

        const bookings = selections.map((selection) => {
            const endHour = Number(selection.slot.split(':')[0]) + 1;

            return {
                resource_id: selection.courtId,
                starts_at: `${selectedDate}T${selection.slot}:00`,
                ends_at: `${selectedDate}T${String(endHour).padStart(2, '0')}:00:00`,
            };
        });

        router.post(storeBookingsBulk().url, { bookings });
    };

    const summary = selections
        .map((s) => `${s.courtName} ${formatSlotRange(s.slot)}`)
        .join(', ');

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => shiftDate(-1)}
                    disabled={selectedDate <= today}
                    aria-label="Previous day"
                >
                    <ChevronLeft className="size-4" />
                </Button>
                <h3 className="text-center text-lg font-bold text-brand-navy sm:text-xl">
                    {format(parseISO(`${selectedDate}T12:00:00`), 'EEEE, MMMM d, yyyy')}
                </h3>
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => shiftDate(1)}
                    disabled={selectedDate >= maxDate}
                    aria-label="Next day"
                >
                    <ChevronRight className="size-4" />
                </Button>
            </div>

            <div className="flex flex-wrap items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <Info className="mt-0.5 size-4 shrink-0 text-brand-court" />
                <Badge
                    variant="secondary"
                    className="bg-sky-100 text-sky-800 uppercase"
                >
                    {isAuthenticated ? 'Member' : 'Non-member'}
                </Badge>
                <span>Bookings are available until {bookingDeadline}.</span>
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
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full min-w-[32rem] border-collapse text-sm">
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                            <th className="px-3 py-3 text-left font-semibold text-slate-700">
                                Time
                            </th>
                            {courts.map((court) => (
                                <th
                                    key={court.id}
                                    className="px-3 py-3 text-center font-semibold text-slate-700"
                                >
                                    {court.name}
                                    <span className="mt-0.5 block text-xs font-normal text-slate-500 capitalize">
                                        Pickleball
                                    </span>
                                </th>
                            ))}
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
                                {courts.map((court) => {
                                    const booked = slotIsBooked(
                                        court.id,
                                        selectedDate,
                                        slot,
                                        bookedSlots,
                                    );
                                    const selected = selectedKeys.has(
                                        selectionKey(court.id, slot),
                                    );

                                    return (
                                        <td key={court.id} className="p-1">
                                            <button
                                                type="button"
                                                disabled={booked}
                                                onClick={() =>
                                                    toggleSlot(court, slot)
                                                }
                                                className={cn(
                                                    'w-full rounded px-2 py-2.5 text-center text-xs font-semibold transition-colors sm:text-sm',
                                                    booked &&
                                                        'cursor-not-allowed bg-slate-100 text-slate-400',
                                                    !booked &&
                                                        selected &&
                                                        'bg-brand-lime/35 text-brand-navy ring-1 ring-brand-lime',
                                                    !booked &&
                                                        !selected &&
                                                        'bg-emerald-50 text-emerald-700 hover:bg-brand-lime/20',
                                                )}
                                            >
                                                {booked
                                                    ? 'Booked'
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

            {(errors.bookings || errors['bookings.0.starts_at']) && (
                <p className="text-destructive text-sm">
                    {errors.bookings ?? errors['bookings.0.starts_at']}
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
                        disabled={!selections.length || processing}
                    >
                        Clear
                    </Button>
                    <Button
                        type="button"
                        onClick={submitBookings}
                        disabled={!selections.length || processing}
                        className="bg-brand-lime font-bold text-brand-navy hover:bg-brand-lime-dark"
                    >
                        {isAuthenticated ? 'Book now' : 'Sign up to book'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
