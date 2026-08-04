import { Package } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/format';
import type { Product } from '@/types/inventory';

type ProductGridProps = {
    products: Product[];
    onSelect: (product: Product) => void;
};

export function ProductGrid({ products, onSelect }: ProductGridProps) {
    if (products.length === 0) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
                <Package className="size-8" />
                <p>No products found.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => {
                const outOfStock = product.stock_quantity <= 0;

                return (
                    <Card
                        key={product.id}
                        role="button"
                        tabIndex={outOfStock ? -1 : 0}
                        aria-disabled={outOfStock}
                        onClick={() => !outOfStock && onSelect(product)}
                        className={
                            outOfStock
                                ? 'cursor-not-allowed opacity-50'
                                : 'cursor-pointer transition hover:border-primary'
                        }
                    >
                        <CardContent className="flex flex-col gap-1 p-4">
                            <span className="text-sm font-medium leading-tight">
                                {product.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {product.category ?? 'Uncategorized'}
                            </span>
                            <div className="mt-2 flex items-center justify-between">
                                <span className="font-semibold">
                                    {formatCurrency(product.price)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {outOfStock
                                        ? 'Out of stock'
                                        : `${product.stock_quantity} in stock`}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
