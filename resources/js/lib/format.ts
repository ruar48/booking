import { format, formatDistanceToNow, parseISO } from 'date-fns';

export function formatDate(value?: string | null): string {
    if (!value) {
        return '—';
    }

    return format(parseISO(value), 'MMM d, yyyy');
}

export function formatDateTime(value?: string | null): string {
    if (!value) {
        return '—';
    }

    return format(parseISO(value), 'MMM d, yyyy h:mm a');
}

export function formatTime(value?: string | null): string {
    if (!value) {
        return '—';
    }

    return format(parseISO(value), 'h:mm a');
}

export function formatRelative(value?: string | null): string {
    if (!value) {
        return '—';
    }

    return formatDistanceToNow(parseISO(value), { addSuffix: true });
}

export function formatCurrency(amount?: number | null): string {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
    }).format(amount ?? 0);
}

export function formatStatusLabel(status: string): string {
    return status
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

export function monthLabel(year: number, month: number): string {
    return format(new Date(year, month - 1, 1), 'MMM yyyy');
}
