import { Minus, Plus, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/format';

export type CartLine = {
    product_id: number;
    name: string;
    unit_price: number;
    quantity: number;
    max_quantity: number;
};

type CartItemRowProps = {
    line: CartLine;
    onIncrement: (productId: number) => void;
    onDecrement: (productId: number) => void;
    onRemove: (productId: number) => void;
};

export function CartItemRow({ line, onIncrement, onDecrement, onRemove }: CartItemRowProps) {
    return (
        <div className="flex items-center justify-between gap-2 border-b py-2 last:border-b-0">
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{line.name}</p>
                <p className="text-xs text-muted-foreground">
                    {formatCurrency(line.unit_price)} each
                </p>
            </div>
            <div className="flex items-center gap-1">
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-7"
                    onClick={() => onDecrement(line.product_id)}
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
                    onClick={() => onIncrement(line.product_id)}
                >
                    <Plus className="size-3" />
                </Button>
            </div>
            <div className="w-16 text-right text-sm font-semibold">
                {formatCurrency(line.unit_price * line.quantity)}
            </div>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-destructive"
                onClick={() => onRemove(line.product_id)}
            >
                <X className="size-3" />
            </Button>
        </div>
    );
}
