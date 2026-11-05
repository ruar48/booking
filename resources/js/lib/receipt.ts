import { differenceInMinutes, format, isSameDay, parseISO } from 'date-fns';

import { formatCurrency } from '@/lib/format';
import type { Receipt, ReceiptItem } from '@/types/receipt';

/**
 * A receipt as the printer sees it: a flat list of lines, top to bottom.
 *
 * The on-screen paper and the saved image are both drawn from this one list,
 * so the copy a customer downloads can't drift from the one they watched print.
 */
export type ReceiptLine =
    | { kind: 'heading'; text: string }
    | { kind: 'center'; text: string; muted?: boolean; spaced?: boolean }
    | { kind: 'caption'; text: string }
    | { kind: 'reference'; text: string }
    | { kind: 'status'; text: string }
    | { kind: 'text'; text: string; muted?: boolean; strong?: boolean; indent?: boolean }
    | { kind: 'row'; label: string; value: string; strong?: boolean }
    | { kind: 'rule' }
    | { kind: 'note'; text: string }
    | { kind: 'qr'; value: string; caption: string };

export function receiptLines(receipt: Receipt): ReceiptLine[] {
    const lines: ReceiptLine[] = [{ kind: 'heading', text: receipt.venue.name.toUpperCase() }];

    if (receipt.venue.address) {
        lines.push({ kind: 'center', text: receipt.venue.address, muted: true });
    }

    lines.push(
        { kind: 'center', text: 'ACKNOWLEDGEMENT RECEIPT', spaced: true },
        { kind: 'rule' },
        { kind: 'caption', text: 'REFERENCE' },
        { kind: 'reference', text: receipt.reference },
        { kind: 'status', text: 'PAID · CONFIRMED' },
        { kind: 'text', text: receipt.title, strong: true },
    );

    const when = scheduleSummary(receipt.items);

    if (when) {
        lines.push({ kind: 'text', text: when });
    }

    lines.push({ kind: 'rule' }, { kind: 'row', label: 'Guest', value: receipt.customer.name ?? '—' });

    if (receipt.customer.phone) {
        lines.push({ kind: 'row', label: 'Mobile', value: receipt.customer.phone });
    }

    lines.push({ kind: 'row', label: 'Payment', value: receipt.method }, { kind: 'rule' });

    for (const item of receipt.items) {
        lines.push({ kind: 'row', label: item.label, value: formatCurrency(item.amount) });

        const detail = itemDetail(item);

        if (detail) {
            lines.push({ kind: 'text', text: detail, muted: true, indent: true });
        }
    }

    // Only spelled out when there is a fee, so the total visibly adds up.
    if (receipt.fee > 0) {
        lines.push(
            { kind: 'row', label: 'Subtotal', value: formatCurrency(receipt.subtotal) },
            { kind: 'row', label: 'Convenience fee', value: formatCurrency(receipt.fee) },
        );
    }

    lines.push(
        { kind: 'row', label: 'TOTAL', value: formatCurrency(receipt.total), strong: true },
        { kind: 'row', label: 'Amount paid', value: formatCurrency(receipt.total) },
        { kind: 'rule' },
        { kind: 'note', text: receipt.note },
        { kind: 'rule' },
        { kind: 'qr', value: receipt.verify_url, caption: 'SCAN TO VERIFY' },
        { kind: 'center', text: `Issued ${format(parseISO(receipt.paid_at), 'EEE, MMM d, yyyy · h:mm a')}`, muted: true },
        { kind: 'center', text: 'SALAMAT PO · THANK YOU', spaced: true },
    );

    return lines;
}

/** "6 PM", or "6:30 PM" when the minutes matter. */
function clock(value: string): string {
    const date = parseISO(value);

    return format(date, date.getMinutes() === 0 ? 'h a' : 'h:mm a');
}

function timeRange(startsAt: string, endsAt: string | null): string {
    return endsAt ? `${clock(startsAt)}–${clock(endsAt)}` : clock(startsAt);
}

function duration(startsAt: string, endsAt: string | null): string | null {
    if (!endsAt) {
        return null;
    }

    const hours = differenceInMinutes(parseISO(endsAt), parseISO(startsAt)) / 60;

    if (hours <= 0) {
        return null;
    }

    return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} hr`;
}

/** The one-line "when" under the title: exact for one slot, a date span for several. */
function scheduleSummary(items: ReceiptItem[]): string | null {
    const timed = items.filter((item): item is ReceiptItem & { starts_at: string } => item.starts_at !== null);

    if (timed.length === 0) {
        return null;
    }

    const first = timed[0];

    if (timed.length === 1) {
        return `${format(parseISO(first.starts_at), 'EEE, MMM d, yyyy')} · ${timeRange(first.starts_at, first.ends_at)}`;
    }

    const start = parseISO(first.starts_at);
    const end = parseISO(timed[timed.length - 1].starts_at);

    return isSameDay(start, end)
        ? format(start, 'EEE, MMM d, yyyy')
        : `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
}

function itemDetail(item: ReceiptItem): string | null {
    if (!item.starts_at) {
        return null;
    }

    const parts = [format(parseISO(item.starts_at), 'EEE, MMM d'), timeRange(item.starts_at, item.ends_at)];
    const quantity = item.players !== null
        ? `${item.players} ${item.players === 1 ? 'player' : 'players'}`
        : duration(item.starts_at, item.ends_at);

    if (quantity) {
        parts.push(quantity);
    }

    return parts.join(' · ');
}
