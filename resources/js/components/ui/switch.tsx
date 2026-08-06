import * as React from 'react';

import { cn } from '@/lib/utils';

type SwitchProps = {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    disabled?: boolean;
    id?: string;
    className?: string;
};

function Switch({ checked, onCheckedChange, disabled, id, className }: SwitchProps) {
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
                'focus-visible:ring-ring inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
                checked ? 'bg-primary' : 'bg-input',
                className,
            )}
        >
            <span
                data-slot="switch-thumb"
                className={cn(
                    'pointer-events-none block size-4 translate-x-0 rounded-full bg-background shadow-lg ring-0 transition-transform',
                    checked && 'translate-x-4',
                )}
            />
        </button>
    );
}

export { Switch };
