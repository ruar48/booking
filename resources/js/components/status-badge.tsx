import { Badge } from '@/components/ui/badge';
import { formatStatusLabel } from '@/lib/format';
import { cn } from '@/lib/utils';

const statusVariants: Record<string, string> = {
    pending: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    approved: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    rejected: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
    cancelled: 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-400 border-zinc-500/20',
    completed: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
    scheduled: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20',
    in_progress: 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20',
    walkover: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
    forfeit: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
    draft: 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-400 border-zinc-500/20',
    registration_open: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    registration_closed: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    paid: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    unpaid: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
    refunded: 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20',
    failed: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
    available: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    maintenance: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    unavailable: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
    active: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    inactive: 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-400 border-zinc-500/20',
};

type StatusBadgeProps = {
    status: string;
    className?: string;
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
    const normalized = status.toLowerCase();

    return (
        <Badge
            variant="outline"
            className={cn(
                statusVariants[normalized] ??
                    'bg-muted text-muted-foreground border-border',
                className,
            )}
        >
            {formatStatusLabel(normalized)}
        </Badge>
    );
}
