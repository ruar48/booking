import { Dumbbell } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/format';
import type { RentalItem } from '@/types/rentals';

type RentalItemGridProps = {
    rentalItems: RentalItem[];
    onSelect: (rentalItem: RentalItem) => void;
};

export function RentalItemGrid({ rentalItems, onSelect }: RentalItemGridProps) {
    if (rentalItems.length === 0) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
                <Dumbbell className="size-8" />
                <p>No rental items found.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {rentalItems.map((rentalItem) => {
                const outOfStock = rentalItem.available_quantity <= 0;

                return (
                    <Card
                        key={rentalItem.id}
                        role="button"
                        tabIndex={outOfStock ? -1 : 0}
                        aria-disabled={outOfStock}
                        onClick={() => !outOfStock && onSelect(rentalItem)}
                        className={
                            outOfStock
                                ? 'cursor-not-allowed opacity-50'
                                : 'cursor-pointer transition hover:border-primary'
                        }
                    >
                        <CardContent className="flex flex-col gap-1 p-4">
                            <span className="text-sm font-medium leading-tight">
                                {rentalItem.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {rentalItem.category ?? 'Uncategorized'}
                            </span>
                            <div className="mt-2 flex items-center justify-between">
                                <span className="font-semibold">
                                    {formatCurrency(rentalItem.rate)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {outOfStock
                                        ? 'Out of stock'
                                        : `${rentalItem.available_quantity} available`}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
