import { Head, Link, useForm } from '@inertiajs/react';
import { BarChart3, ListOrdered, ShoppingCart } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';

import { CartItemRow, type CartLine } from '@/components/pos/cart-item-row';
import { ProductGrid } from '@/components/pos/product-grid';
import { PageHeader } from '@/components/page-header';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/format';
import { checkout as posCheckout, reports as posReports } from '@/routes/pos';
import { index as posSalesIndex, store } from '@/routes/pos/sales';
import type { Product } from '@/types/inventory';
import type { PaymentMethodOption } from '@/types/pos';

type Props = {
    products: Product[];
    paymentMethods: PaymentMethodOption[];
};

export default function PosCheckout({ products, paymentMethods }: Props) {
    const [cart, setCart] = useState<CartLine[]>([]);

    const { data, setData, post, processing, errors, reset } = useForm({
        items: [] as { product_id: number; quantity: number }[],
        payment_method: paymentMethods[0]?.value ?? 'cash',
        customer_id: '',
        discount: 0,
        tax: 0,
        notes: '',
    });

    const addToCart = (product: Product) => {
        setCart((prev) => {
            const existing = prev.find((line) => line.product_id === product.id);

            if (existing) {
                if (existing.quantity >= product.stock_quantity) {
                    return prev;
                }

                return prev.map((line) =>
                    line.product_id === product.id
                        ? { ...line, quantity: line.quantity + 1 }
                        : line,
                );
            }

            return [
                ...prev,
                {
                    product_id: product.id,
                    name: product.name,
                    unit_price: Number(product.price),
                    quantity: 1,
                    max_quantity: product.stock_quantity,
                },
            ];
        });
    };

    const increment = (productId: number) => {
        setCart((prev) =>
            prev.map((line) =>
                line.product_id === productId && line.quantity < line.max_quantity
                    ? { ...line, quantity: line.quantity + 1 }
                    : line,
            ),
        );
    };

    const decrement = (productId: number) => {
        setCart((prev) =>
            prev.map((line) =>
                line.product_id === productId
                    ? { ...line, quantity: Math.max(1, line.quantity - 1) }
                    : line,
            ),
        );
    };

    const remove = (productId: number) => {
        setCart((prev) => prev.filter((line) => line.product_id !== productId));
    };

    const subtotal = useMemo(
        () => cart.reduce((sum, line) => sum + line.unit_price * line.quantity, 0),
        [cart],
    );

    const total = useMemo(
        () => Math.max(0, subtotal - Number(data.discount || 0) + Number(data.tax || 0)),
        [subtotal, data.discount, data.tax],
    );

    const submit = (event: FormEvent) => {
        event.preventDefault();

        setData('items', cart.map((line) => ({
            product_id: line.product_id,
            quantity: line.quantity,
        })));

        post(store().url, {
            onSuccess: () => {
                setCart([]);
                reset('items', 'notes', 'customer_id', 'discount', 'tax');
            },
        });
    };

    return (
        <>
            <Head title="Point of Sale" />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <PageHeader
                    title="Point of Sale"
                    description="Ring up a walk-in sale"
                    actions={
                        <>
                            <Button variant="outline" asChild>
                                <Link href={posReports()}>
                                    <BarChart3 className="size-4" />
                                    Report
                                </Link>
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href={posSalesIndex()}>
                                    <ListOrdered className="size-4" />
                                    Transactions
                                </Link>
                            </Button>
                        </>
                    }
                />

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <ProductGrid products={products} onSelect={addToCart} />
                    </div>

                    <Card className="h-fit lg:sticky lg:top-4">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShoppingCart className="size-4" />
                                Cart
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit} className="space-y-4">
                                <div>
                                    {cart.length === 0 ? (
                                        <p className="py-6 text-center text-sm text-muted-foreground">
                                            Add products to start a sale.
                                        </p>
                                    ) : (
                                        cart.map((line) => (
                                            <CartItemRow
                                                key={line.product_id}
                                                line={line}
                                                onIncrement={increment}
                                                onDecrement={decrement}
                                                onRemove={remove}
                                            />
                                        ))
                                    )}
                                </div>
                                <InputError message={errors.items} />

                                <div className="space-y-1 border-t pt-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Subtotal</span>
                                        <span>{formatCurrency(subtotal)}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                        <Label htmlFor="discount" className="text-muted-foreground">
                                            Discount
                                        </Label>
                                        <Input
                                            id="discount"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            className="h-7 w-24 text-right"
                                            value={data.discount}
                                            onChange={(e) =>
                                                setData('discount', Number(e.target.value))
                                            }
                                        />
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                        <Label htmlFor="tax" className="text-muted-foreground">
                                            Tax
                                        </Label>
                                        <Input
                                            id="tax"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            className="h-7 w-24 text-right"
                                            value={data.tax}
                                            onChange={(e) =>
                                                setData('tax', Number(e.target.value))
                                            }
                                        />
                                    </div>
                                    <div className="flex justify-between text-base font-semibold">
                                        <span>Total</span>
                                        <span>{formatCurrency(total)}</span>
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label>Payment method</Label>
                                    <Select
                                        value={data.payment_method}
                                        onValueChange={(value) =>
                                            setData(
                                                'payment_method',
                                                value as 'cash' | 'card' | 'bank_transfer',
                                            )
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {paymentMethods.map((method) => (
                                                <SelectItem key={method.value} value={method.value}>
                                                    {method.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.payment_method} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="customer_id">Customer ID (optional)</Label>
                                    <Input
                                        id="customer_id"
                                        type="number"
                                        value={data.customer_id}
                                        onChange={(e) => setData('customer_id', e.target.value)}
                                    />
                                    <InputError message={errors.customer_id} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="notes">Notes</Label>
                                    <Textarea
                                        id="notes"
                                        rows={2}
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={processing || cart.length === 0}
                                >
                                    Complete sale
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

PosCheckout.layout = {
    breadcrumbs: [{ title: 'Point of Sale', href: posCheckout() }],
};
