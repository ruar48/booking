import { MessageCircle } from 'lucide-react';

import { cn } from '@/lib/utils';

export const MESSENGER_GRADIENT = 'bg-[linear-gradient(135deg,#0866ff_0%,#a033ff_60%,#ff5c87_100%)]';

/**
 * A round, Messenger-coloured chat badge. Deliberately generic — a filled
 * chat bubble on the familiar gradient — rather than Meta's own logo.
 */
export function MessengerBadge({ className, iconClassName }: { className?: string; iconClassName?: string }) {
    return (
        <span className={cn(MESSENGER_GRADIENT, 'flex shrink-0 items-center justify-center rounded-full text-white', className)}>
            <MessageCircle className={cn('size-1/2', iconClassName)} fill="currentColor" strokeWidth={0} />
        </span>
    );
}
