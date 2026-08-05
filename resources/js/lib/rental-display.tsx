import { isPast, isToday, isTomorrow, parseISO } from 'date-fns';
import {
    Backpack,
    CircleDot,
    Dumbbell,
    Footprints,
    GlassWater,
    Package,
    type LucideIcon,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { formatDate, formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { RentalTransaction } from '@/types/rentals';

export type DueTone = 'emerald' | 'amber' | 'orange' | 'red' | 'zinc' | 'blue';

export const dueToneClasses: Record<DueTone, string> = {
    emerald: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    orange: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
    red: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
    zinc: 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-400 border-zinc-500/20',
    blue: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
};

const dueDotClasses: Record<DueTone, string> = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
    zinc: 'bg-zinc-400',
    blue: 'bg-blue-500',
};

export function getRentalItemIcon(name: string): LucideIcon {
    const n = name.toLowerCase();

    if (n.includes('shoe')) return Footprints;
    if (n.includes('ball')) return CircleDot;
    if (n.includes('paddle')) return Dumbbell;
    if (n.includes('bag')) return Backpack;
    if (n.includes('water') || n.includes('bottle')) return GlassWater;

    return Package;
}

export function getDueMeta(transaction: RentalTransaction): { label: string; tone: DueTone } {
    if (transaction.status === 'returned') {
        return { label: 'Returned', tone: 'zinc' };
    }

    if (transaction.status === 'lost') {
        return { label: 'Lost', tone: 'red' };
    }

    if (transaction.status === 'reserved') {
        return { label: 'Reserved', tone: 'blue' };
    }

    if (!transaction.due_at) {
        return transaction.status === 'overdue'
            ? { label: 'Overdue', tone: 'red' }
            : { label: 'Active', tone: 'emerald' };
    }

    const due = parseISO(transaction.due_at);

    if (transaction.status === 'overdue' || (isPast(due) && !isToday(due))) {
        return { label: 'Overdue', tone: 'red' };
    }

    if (isToday(due)) {
        return { label: 'Due today', tone: 'amber' };
    }

    if (isTomorrow(due)) {
        return { label: 'Due tomorrow', tone: 'orange' };
    }

    return { label: 'Active', tone: 'emerald' };
}

export function formatDueLabel(dueAt?: string | null): string {
    if (!dueAt) {
        return 'No due date';
    }

    const due = parseISO(dueAt);

    if (isToday(due)) {
        return `Today • ${formatTime(dueAt)}`;
    }

    if (isTomorrow(due)) {
        return `Tomorrow • ${formatTime(dueAt)}`;
    }

    return `${formatDate(dueAt)} • ${formatTime(dueAt)}`;
}

export function formatDurationLabel(transaction: RentalTransaction): string {
    if (transaction.duration_type === 'hourly' && transaction.duration_hours) {
        return `${transaction.duration_hours}h`;
    }

    return 'Whole day';
}

export function formatReservedForLabel(reservedFor?: string | null): string {
    if (!reservedFor) {
        return '—';
    }

    const date = parseISO(reservedFor);

    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';

    return formatDate(reservedFor);
}

export function DueBadge({ tone, label }: { tone: DueTone; label: string }) {
    return (
        <Badge variant="outline" className={cn('gap-1.5', dueToneClasses[tone])}>
            <span className={cn('size-1.5 rounded-full', dueDotClasses[tone])} />
            {label}
        </Badge>
    );
}
