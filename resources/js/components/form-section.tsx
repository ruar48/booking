import type { ReactNode } from 'react';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

type FormSectionProps = {
    title: string;
    description?: string;
    children: ReactNode;
    className?: string;
    /** Applied to the field grid — override to change the column layout. */
    contentClassName?: string;
};

/**
 * One titled group of fields on a form page. Long forms read far better broken
 * into labelled sections than as a single undifferentiated card.
 */
export function FormSection({
    title,
    description,
    children,
    className,
    contentClassName,
}: FormSectionProps) {
    return (
        <Card className={cn('gap-0 py-0', className)}>
            <CardHeader className="border-b px-5 py-4">
                <CardTitle className="text-base">{title}</CardTitle>
                {description ? (
                    <CardDescription>{description}</CardDescription>
                ) : null}
            </CardHeader>
            <CardContent
                className={cn('grid gap-4 p-5 sm:grid-cols-2', contentClassName)}
            >
                {children}
            </CardContent>
        </Card>
    );
}
