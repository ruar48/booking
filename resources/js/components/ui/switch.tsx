import * as React from 'react';

import { cn } from '@/lib/utils';

type SwitchProps = {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    disabled?: boolean;
    id?: string;
    className?: string;
    /** `lg` for a short list of choices people tap on a phone, like the cookie banner. */
    size?: 'default' | 'lg';
};

// The thumb sits 2px inside the track on every side, on or off.
const SIZES = {
    default: { track: 'h-5 w-9', thumb: 'size-4', on: 'translate-x-4' },
    lg: { track: 'h-7 w-12', thumb: 'size-6', on: 'translate-x-5' },
} as const;

function Switch({ checked, onCheckedChange, disabled, id, className, size = 'default' }: SwitchProps) {
    const sizing = SIZES[size];

    return (
        <button
            type="button"
            role="switch"
            id={id}
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onCheckedChange(!checked)}
            data-slot="switch"
            className={cn(
                'focus-visible:ring-ring inline-flex shrink-0 items-center rounded-full border border-transparent px-px transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
                sizing.track,
                // Off is a solid grey rather than the input-border tint, which
                // on a white card read as no switch at all.
                checked ? 'bg-primary' : 'bg-muted-foreground/45',
                className,
            )}
        >
            <span
                data-slot="switch-thumb"
                className={cn(
                    // White in both themes: the page background made a dark thumb on a dark track.
                    'pointer-events-none block translate-x-0 rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-transform',
                    sizing.thumb,
                    checked && sizing.on,
                )}
            />
        </button>
    );
}

export { Switch };
