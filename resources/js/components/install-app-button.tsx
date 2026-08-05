import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { usePwaInstall } from '@/hooks/use-pwa-install';
import { cn } from '@/lib/utils';
import { Download, Share, SquarePlus } from 'lucide-react';

type Props = {
    className?: string;
    variant?: 'default' | 'outline' | 'ghost';
    /** Render as an icon-only button (e.g. for a compact header). */
    iconOnly?: boolean;
};

export function InstallAppButton({ className, variant = 'outline', iconOnly = false }: Props) {
    const { canInstall, isIos, promptInstall } = usePwaInstall();

    if (!canInstall) return null;

    if (isIos) {
        return (
            <Popover>
                <PopoverTrigger asChild>
                    {iconOnly ? (
                        <Button
                            variant={variant}
                            size="icon"
                            className={className}
                            aria-label="Install app"
                        >
                            <Download />
                        </Button>
                    ) : (
                        <Button variant={variant} className={cn('gap-2', className)}>
                            <Download />
                            Install app
                        </Button>
                    )}
                </PopoverTrigger>
                <PopoverContent align="end" className="text-sm">
                    <p className="font-medium">Install this app</p>
                    <p className="mt-1 text-muted-foreground">
                        Tap <Share className="inline size-3.5 -translate-y-px" /> in Safari,
                        then choose{' '}
                        <span className="inline-flex items-center gap-1 font-medium text-foreground">
                            Add to Home Screen <SquarePlus className="inline size-3.5" />
                        </span>
                        .
                    </p>
                </PopoverContent>
            </Popover>
        );
    }

    if (iconOnly) {
        return (
            <Button
                variant={variant}
                size="icon"
                className={className}
                onClick={promptInstall}
                aria-label="Install app"
            >
                <Download />
            </Button>
        );
    }

    return (
        <Button variant={variant} className={cn('gap-2', className)} onClick={promptInstall}>
            <Download />
            Install app
        </Button>
    );
}
