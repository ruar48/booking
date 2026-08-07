import type { LucideIcon } from 'lucide-react';
import { TrendingDown, TrendingUp } from 'lucide-react';

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

type StatCardProps = {
    label: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: number;
        label?: string;
    };
    className?: string;
    iconClassName?: string;
};

export function StatCard({
    label,
    value,
    icon: Icon,
    trend,
    className,
    iconClassName,
}: StatCardProps) {
    const isPositive = trend ? trend.value >= 0 : true;

    return (
        <Card className={cn('gap-4 py-4', className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 pb-0">
                <CardTitle className="text-muted-foreground text-sm font-medium">
                    {label}
                </CardTitle>
                <div
                    className={cn(
                        'bg-primary/10 text-primary rounded-md p-2',
                        iconClassName,
                    )}
                >
                    <Icon className="size-4" />
                </div>
            </CardHeader>
            <CardContent className="px-4">
                <div className="text-2xl font-bold">{value}</div>
                {trend ? (
                    <div
                        className={cn(
                            'mt-1 flex items-center gap-1 text-xs',
                            isPositive
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-red-600 dark:text-red-400',
                        )}
                    >
                        {isPositive ? (
                            <TrendingUp className="size-3" />
                        ) : (
                            <TrendingDown className="size-3" />
                        )}
                        <span>
                            {isPositive ? '+' : ''}
                            {trend.value}%
                        </span>
                        {trend.label ? (
                            <span className="text-muted-foreground">
                                {trend.label}
                            </span>
                        ) : null}
                    </div>
                ) : null}
            </CardContent>
        </Card>
    );
}
