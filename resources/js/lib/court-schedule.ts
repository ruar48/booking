import { format, parseISO } from 'date-fns';

import type { BookedSlot } from '@/types/booking';

// Pure slot math shared by the booking grid and the home page booking panel.

export type SlotSelection = {
    courtId: number;
    courtName: string;
    slot: string;
};

export type BookingRun = {
    resource_id: number;
    starts_at: string;
    ends_at: string;
};

export function slotToMinutes(slot: string): number {
    const [hours, minutes] = slot.split(':').map(Number);

    return hours * 60 + minutes;
}

export function minutesToSlot(totalMinutes: number): string {
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
export function buildBookingRuns(
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

export function generateTimeSlots(open: string, close: string): string[] {
    const openMinutes = slotToMinutes(open);
    const closeMinutes = slotToMinutes(close);
    const slots: string[] = [];

    for (let start = openMinutes; start + 60 <= closeMinutes; start += 60) {
        slots.push(minutesToSlot(start));
    }

    return slots;
}

export function findBookedSlot(
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

export function isOpenPlaySlot(bookedSlot: BookedSlot | undefined): boolean {
    return typeof bookedSlot?.id === 'string' && bookedSlot.id.startsWith('open-play-');
}

/**
 * Open Play slot ids are formatted as 'open-play-{sessionId}-{resourceId}'
 * (see ResourceBookingService::getOpenPlayBookedSlots) — pull the session id
 * back out so the cell can link to that session.
 */
export function openPlaySessionId(bookedSlot: BookedSlot | undefined): number | null {
    if (typeof bookedSlot?.id !== 'string') {
        return null;
    }

    const match = bookedSlot.id.match(/^open-play-(\d+)-\d+$/);

    return match ? Number(match[1]) : null;
}

export function slotIsPast(date: string, slot: string): boolean {
    const slotStart = new Date(`${date}T${slot}:00`);

    return slotStart <= new Date();
}

export function formatSlotRange(slot: string): string {
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

export function selectionKey(courtId: number, slot: string): string {
    return `${courtId}-${slot}`;
}
