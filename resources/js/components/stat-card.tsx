import type { LucideIcon } from 'lucide-react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { useId } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type StatTone = 'brand' | 'blue' | 'violet' | 'emerald' | 'red' | 'amber';

/**
 * Sparkline strokes have to be literal color values because they land on SVG
 * attributes, where Tailwind classes don't apply — so each tone carries its
 * icon-chip classes, its card wash, and its chart color together.
 */
const TONES: Record<StatTone, { chip: string; wash: string; chart: string }> = {
    brand: {
        chip: 'bg-primary/10 text-primary',
        wash: 'to-primary/[0.07]',
        chart: '#16a34a',
    },
    blue: {
        chip: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
        wash: 'to-blue-500/[0.09]',
        chart: '#2563eb',
    },
    violet: {
        chip: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
        wash: 'to-violet-500/[0.09]',
        chart: '#7c3aed',
    },
    emerald: {
        chip: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        wash: 'to-emerald-500/[0.1]',
        chart: '#059669',
    },
    red: {
        chip: 'bg-red-500/10 text-red-600 dark:text-red-400',
        wash: 'to-rose-500/[0.11]',
        chart: '#e11d48',
    },
    amber: {
        chip: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        wash: 'to-amber-500/[0.1]',
        chart: '#d97706',
    },
};

type StatCardProps = {
    label: string;
    value: string | number;
    icon: LucideIcon;
    tone?: StatTone;
    /** Small line under the value, e.g. "All time" or "1 booking". */
    caption?: string;
    /** Oldest-to-newest series drawn into the card's bottom-right corner. */
    sparkline?: number[];
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
    tone = 'brand',
    caption,
    sparkline,
    trend,
    className,
    iconClassName,
}: StatCardProps) {
    const isPositive = trend ? trend.value >= 0 : true;
    const toneStyles = TONES[tone];
    const hasSparkline = Boolean(sparkline && sparkline.length > 1);

    return (
        <Card
            className={cn(
                'relative gap-0 overflow-hidden bg-linear-to-br from-card py-4',
                toneStyles.wash,
                className,
            )}
        >
            {hasSparkline ? (
                <div
                    className="pointer-events-none absolute right-0 bottom-0 h-[58%] w-[62%]"
                    aria-hidden="true"
                >
                    <Sparkline
                        data={sparkline as number[]}
                        color={toneStyles.chart}
                    />
                </div>
            ) : null}

            <CardContent className="relative px-4">
                <div className="flex items-start justify-between gap-2">
                    <p className="text-muted-foreground text-sm font-medium">
                        {label}
                    </p>
                    <div
                        className={cn(
                            'rounded-md p-2',
                            toneStyles.chip,
                            iconClassName,
                        )}
                    >
                        <Icon className="size-4" />
                    </div>
                </div>

                <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums">
                    {value}
                </p>

                {caption ? (
                    <p className="text-muted-foreground mt-1 text-xs">
                        {caption}
                    </p>
                ) : null}

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

function Sparkline({ data, color }: { data: number[]; color: string }) {
    // Gradient ids are document-global, so each instance needs its own or
    // every sparkline inherits the first card's color.
    const gradientId = useId();
    const points = data.map((value, index) => ({ index, value }));

    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.24} />
                        <stop offset="100%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <Area
                    type="monotone"
                    dataKey="value"
                    stroke={color}
                    strokeWidth={2}
                    fill={`url(#${gradientId})`}
                    isAnimationActive={false}
                    dot={false}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}
