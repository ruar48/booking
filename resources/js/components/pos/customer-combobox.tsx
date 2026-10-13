import { Check, ChevronsUpDown, X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { CustomerOption } from '@/types/pos';

type Props = {
    id?: string;
    customers: CustomerOption[];
    value: string;
    onChange: (value: string) => void;
};

export function CustomerCombobox({ id, customers, value, onChange }: Props) {
    const [open, setOpen] = useState(false);
    const selected = customers.find((c) => String(c.id) === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    id={id}
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between font-normal"
                >
                    <span className={cn('truncate', !selected && 'text-muted-foreground')}>
                        {selected ? selected.name : 'Walk-in customer'}
                    </span>
                    <span className="flex items-center gap-1">
                        {selected && (
                            <X
                                className="size-4 opacity-50 hover:opacity-100"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onChange('');
                                }}
                            />
                        )}
                        <ChevronsUpDown className="size-4 opacity-50" />
                    </span>
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-(--radix-popover-trigger-width) p-0"
                align="start"
            >
                <Command>
                    <CommandInput placeholder="Search name or email..." />
                    <CommandList>
                        <CommandEmpty>No customer found.</CommandEmpty>
                        <CommandGroup>
                            {customers.map((customer) => (
                                <CommandItem
                                    key={customer.id}
                                    value={`${customer.name} ${customer.email}`}
                                    onSelect={() => {
                                        onChange(String(customer.id));
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            'size-4',
                                            String(customer.id) === value
                                                ? 'opacity-100'
                                                : 'opacity-0',
                                        )}
                                    />
                                    <div className="flex min-w-0 flex-col">
                                        <span className="truncate">{customer.name}</span>
                                        <span className="truncate text-xs text-muted-foreground">
                                            {customer.email}
                                        </span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
