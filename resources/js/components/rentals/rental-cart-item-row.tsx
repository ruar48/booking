import { Minus, Plus, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/format';

export type RentalCartLine = {
    rental_item_id: number;
    name: string;
    rate: number;
    quantity: number;
    max_quantity: number;
};

type RentalCartItemRowProps = {
    line: RentalCartLine;
    onIncrement: (rentalItemId: number) => void;
    onDecrement: (rentalItemId: number) => void;
    onRemove: (rentalItemId: number) => void;
};

export function RentalCartItemRow({ line, onIncrement, onDecrement, onRemove }: RentalCartItemRowProps) {
    return (
        <div className="flex items-center justify-between gap-2 border-b py-2 last:border-b-0">
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{line.name}</p>
                <p className="text-xs text-muted-foreground">
                    {formatCurrency(line.rate)} each
                </p>
            </div>
            <div className="flex items-center gap-1">
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-7"
                    onClick={() => onDecrement(line.rental_item_id)}
                >
                    <Minus className="size-3" />
                </Button>
                <span className="w-6 text-center text-sm">{line.quantity}</span>
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-7"
                    disabled={line.quantity >= line.max_quantity}
                    onClick={() => onIncrement(line.rental_item_id)}
                >
                    <Plus className="size-3" />
                </Button>
            </div>
            <div className="w-16 text-right text-sm font-semibold">
                {formatCurrency(line.rate * line.quantity)}
            </div>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-destructive"
                onClick={() => onRemove(line.rental_item_id)}
            >
                <X className="size-3" />
            </Button>
        </div>
    );
}
