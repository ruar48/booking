import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type FormSectionTone =
    'brand' | 'blue' | 'violet' | 'emerald' | 'amber' | 'rose';

const TONES: Record<FormSectionTone, string> = {
    brand: 'bg-primary/10 text-primary',
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
};

type FormSectionProps = {
    title: string;
    description?: string;
    icon?: LucideIcon;
    tone?: FormSectionTone;
    children: ReactNode;
    className?: string;
    /** Applied to the field grid — override to change the column layout. */
    contentClassName?: string;
};

/**
 * One titled group of fields on a form page. Long forms read far better broken
 * into labelled sections than as a single undifferentiated card, and the tinted
 * icon gives each section a distinct anchor when scanning down the page.
 */
export function FormSection({
    title,
    description,
    icon: Icon,
    tone = 'brand',
    children,
    className,
    contentClassName,
}: FormSectionProps) {
    return (
        <Card className={cn('gap-0 py-0', className)}>
            <CardHeader className="flex flex-row items-start gap-3 px-5 pt-5 pb-4">
                {Icon ? (
                    <div
                        className={cn(
                            'flex size-9 shrink-0 items-center justify-center rounded-lg',
                            TONES[tone],
                        )}
                    >
                        <Icon className="size-4.5" />
                    </div>
                ) : null}
                <div className="min-w-0 flex-1">
                    <CardTitle className="text-base leading-tight">
                        {title}
                    </CardTitle>
                    {description ? (
                        <CardDescription className="mt-0.5">
                            {description}
                        </CardDescription>
                    ) : null}
                </div>
            </CardHeader>
            <CardContent
                className={cn(
                    'grid gap-4 px-5 pb-5 sm:grid-cols-2',
                    contentClassName,
                )}
            >
                {children}
            </CardContent>
        </Card>
    );
}
