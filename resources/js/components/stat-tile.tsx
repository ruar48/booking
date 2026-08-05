import type { LucideIcon } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function StatTile({
    icon: Icon,
    label,
    value,
    tone,
}: {
    icon: LucideIcon;
    label: string;
    value: string | number;
    tone?: 'red' | 'amber';
}) {
    return (
        <Card>
            <CardContent className="flex flex-col items-center gap-1 p-4 text-center">
                <Icon
                    className={cn(
                        'size-4',
                        tone === 'red'
                            ? 'text-red-600 dark:text-red-400'
                            : tone === 'amber'
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-muted-foreground',
                    )}
                />
                <p className="text-muted-foreground text-xs">{label}</p>
                <p
                    className={cn(
                        'text-xl leading-tight font-bold',
                        tone === 'red' && 'text-red-600 dark:text-red-400',
                        tone === 'amber' && 'text-amber-600 dark:text-amber-400',
                    )}
                >
                    {value}
                </p>
            </CardContent>
        </Card>
    );
}
