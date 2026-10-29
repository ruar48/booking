import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { PaddleDuel } from '@/components/paddle-duel';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type EmptyStateProps = {
    icon: LucideIcon;
    title: string;
    description?: string;
    action?: ReactNode;
    className?: string;
};

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    className,
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-16 text-center',
                className,
            )}
        >
            {/* The rally for most visitors; the plain icon for anyone who has asked for less motion. */}
            <PaddleDuel className="text-muted-foreground mb-2 w-full max-w-sm motion-reduce:hidden" bigCheers label={title} />
            <div className="bg-muted text-muted-foreground mb-4 hidden rounded-full p-3 motion-reduce:block">
                <Icon className="size-6" />
            </div>
            <h3 className="text-lg font-medium">{title}</h3>
            {description ? (
                <p className="text-muted-foreground mt-1 max-w-sm text-sm">
                    {description}
                </p>
            ) : null}
            {action ? <div className="mt-6">{action}</div> : null}
        </div>
    );
}

export function EmptyStateAction({
    children,
    ...props
}: React.ComponentProps<typeof Button>) {
    return <Button {...props}>{children}</Button>;
}
