import { Download, EllipsisVertical, Share, SquarePlus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { usePwaInstall } from '@/hooks/use-pwa-install';
import { cn } from '@/lib/utils';

type Props = {
    className?: string;
    variant?: 'default' | 'outline' | 'ghost';
    /** Render as an icon-only button (e.g. for a compact header). */
    iconOnly?: boolean;
};

/**
 * Always offered (except inside the installed app). Browsers that expose a
 * native install dialog get it on click; the rest — iOS Safari, Firefox,
 * desktop Safari, or Chrome before it decides to offer — get instructions.
 */
export function InstallAppButton({
    className,
    variant = 'outline',
    iconOnly = false,
}: Props) {
    const { installed, canPrompt, isIos, promptInstall } = usePwaInstall();

    if (installed) {
        return null;
    }

    const button = iconOnly ? (
        <Button
            variant={variant}
            size="icon"
            className={className}
            onClick={canPrompt ? promptInstall : undefined}
            aria-label="Install app"
        >
            <Download />
        </Button>
    ) : (
        <Button
            variant={variant}
            className={cn('gap-2', className)}
            onClick={canPrompt ? promptInstall : undefined}
        >
            <Download />
            Install app
        </Button>
    );

    if (canPrompt) {
        return button;
    }

    return (
        <Popover>
            <PopoverTrigger asChild>{button}</PopoverTrigger>
            <PopoverContent align="end" className="text-sm">
                <p className="font-medium">Install this app</p>
                {isIos ? (
                    <p className="mt-1 text-muted-foreground">
                        Tap{' '}
                        <Share className="inline size-3.5 -translate-y-px" /> in
                        Safari, then choose{' '}
                        <span className="inline-flex items-center gap-1 font-medium text-foreground">
                            Add to Home Screen{' '}
                            <SquarePlus className="inline size-3.5" />
                        </span>
                        .
                    </p>
                ) : (
                    <ul className="mt-1 space-y-1.5 text-muted-foreground">
                        <li>
                            <span className="font-medium text-foreground">
                                Android:
                            </span>{' '}
                            tap{' '}
                            <EllipsisVertical className="inline size-3.5 -translate-y-px" />{' '}
                            in your browser, then{' '}
                            <span className="font-medium text-foreground">
                                Install app
                            </span>{' '}
                            or{' '}
                            <span className="font-medium text-foreground">
                                Add to Home screen
                            </span>
                            .
                        </li>
                        <li>
                            <span className="font-medium text-foreground">
                                Chrome / Edge on a computer:
                            </span>{' '}
                            click the install icon at the right of the address
                            bar, or open the browser menu and choose{' '}
                            <span className="font-medium text-foreground">
                                Install
                            </span>
                            .
                        </li>
                        <li>
                            <span className="font-medium text-foreground">
                                Safari on a Mac:
                            </span>{' '}
                            choose{' '}
                            <span className="font-medium text-foreground">
                                File → Add to Dock
                            </span>
                            .
                        </li>
                    </ul>
                )}
            </PopoverContent>
        </Popover>
    );
}
