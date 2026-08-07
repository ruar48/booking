import { Head, useForm } from '@inertiajs/react';
import { Dumbbell, X } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';

import InputError from '@/components/input-error';
import { PageHeader } from '@/components/page-header';
import { RentalCartItemRow, type RentalCartLine } from '@/components/rentals/rental-cart-item-row';
import { RentalItemGrid } from '@/components/rentals/rental-item-grid';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/format';
import customers from '@/routes/bookings/customers';
import { checkout as rentalsCheckout, store } from '@/routes/rentals';
import type { RentalItem } from '@/types/rentals';

type Props = {
    rentalItems: RentalItem[];
};

type RenterSearchResult = {
    id: number;
    name: string;
    phone: string | null;
};

export default function RentalsCheckout({ rentalItems }: Props) {
    const [cart, setCart] = useState<RentalCartLine[]>([]);

    const [renterQuery, setRenterQuery] = useState('');
    const [renterResults, setRenterResults] = useState<RenterSearchResult[]>([]);
    const [selectedRenter, setSelectedRenter] = useState<RenterSearchResult | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        items: [] as { rental_item_id: number; quantity: number }[],
        renter_id: '',
        renter_name: '',
        due_at: '',
        notes: '',
    });

    useEffect(() => {
        if (selectedRenter || renterQuery.trim().length < 2) {
            setRenterResults([]);
            return;
        }

        const handle = window.setTimeout(() => {
            fetch(customers.search.url({ query: { q: renterQuery } }), {
                headers: { Accept: 'application/json' },
            })
                .then((response) => (response.ok ? response.json() : []))
                .then((results: RenterSearchResult[]) => setRenterResults(results))
                .catch(() => setRenterResults([]));
        }, 300);

        return () => window.clearTimeout(handle);
    }, [renterQuery, selectedRenter]);

    const selectRenter = (renter: RenterSearchResult) => {
        setSelectedRenter(renter);
        setData('renter_id', String(renter.id));
        setRenterQuery(renter.name);
        setRenterResults([]);
    };

    const clearRenter = () => {
        setSelectedRenter(null);
        setData('renter_id', '');
        setRenterQuery('');
    };

    const addToCart = (rentalItem: RentalItem) => {
        setCart((prev) => {
            const existing = prev.find((line) => line.rental_item_id === rentalItem.id);

            if (existing) {
                if (existing.quantity >= rentalItem.available_quantity) {
                    return prev;
                }

                return prev.map((line) =>
                    line.rental_item_id === rentalItem.id
                        ? { ...line, quantity: line.quantity + 1 }
                        : line,
                );
            }

            return [
                ...prev,
                {
                    rental_item_id: rentalItem.id,
                    name: rentalItem.name,
                    rate: Number(rentalItem.rate),
                    quantity: 1,
                    max_quantity: rentalItem.available_quantity,
                },
            ];
        });
    };

    const increment = (rentalItemId: number) => {
        setCart((prev) =>
            prev.map((line) =>
                line.rental_item_id === rentalItemId && line.quantity < line.max_quantity
                    ? { ...line, quantity: line.quantity + 1 }
                    : line,
            ),
        );
    };

    const decrement = (rentalItemId: number) => {
        setCart((prev) =>
            prev.map((line) =>
                line.rental_item_id === rentalItemId
                    ? { ...line, quantity: Math.max(1, line.quantity - 1) }
                    : line,
            ),
        );
    };

    const remove = (rentalItemId: number) => {
        setCart((prev) => prev.filter((line) => line.rental_item_id !== rentalItemId));
    };

    const total = useMemo(
        () => cart.reduce((sum, line) => sum + line.rate * line.quantity, 0),
        [cart],
    );

    const submit = (event: FormEvent) => {
        event.preventDefault();

        setData('items', cart.map((line) => ({
            rental_item_id: line.rental_item_id,
            quantity: line.quantity,
        })));

        post(store().url, {
            onSuccess: () => {
                setCart([]);
                clearRenter();
                reset('items', 'notes', 'renter_id', 'renter_name', 'due_at');
            },
        });
    };

    return (
        <>
            <Head title="Rent Out" />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <PageHeader
                    title="Rent Out"
                    description="Check out equipment to a member or walk-in"
                />

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <RentalItemGrid rentalItems={rentalItems} onSelect={addToCart} />
                    </div>

                    <Card className="h-fit lg:sticky lg:top-4">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Dumbbell className="size-4" />
                                Rental cart
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit} className="space-y-4">
                                <div>
                                    {cart.length === 0 ? (
                                        <p className="py-6 text-center text-sm text-muted-foreground">
                                            Add items to start a rental.
                                        </p>
                                    ) : (
                                        cart.map((line) => (
                                            <RentalCartItemRow
                                                key={line.rental_item_id}
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
                                    <div className="flex justify-between text-base font-semibold">
                                        <span>Total</span>
                                        <span>{formatCurrency(total)}</span>
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="renter-search">Renter</Label>
                                    {selectedRenter ? (
                                        <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                                            <span>{selectedRenter.name}</span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="size-6"
                                                onClick={clearRenter}
                                            >
                                                <X className="size-3" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <Input
                                                id="renter-search"
                                                placeholder="Search member by name or phone..."
                                                value={renterQuery}
                                                onChange={(e) => setRenterQuery(e.target.value)}
                                            />
                                            {renterResults.length > 0 && (
                                                <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md">
                                                    {renterResults.map((result) => (
                                                        <button
                                                            key={result.id}
                                                            type="button"
                                                            className="block w-full px-3 py-2 text-left text-sm hover:bg-accent"
                                                            onClick={() => selectRenter(result)}
                                                        >
                                                            {result.name}
                                                            {result.phone ? ` — ${result.phone}` : ''}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <InputError message={errors.renter_id} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="renter_name">Walk-in name (optional)</Label>
                                    <Input
                                        id="renter_name"
                                        value={data.renter_name}
                                        onChange={(e) => setData('renter_name', e.target.value)}
                                        disabled={!!selectedRenter}
                                    />
                                    <InputError message={errors.renter_name} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="due_at">Due back</Label>
                                    <Input
                                        id="due_at"
                                        type="datetime-local"
                                        value={data.due_at}
                                        onChange={(e) => setData('due_at', e.target.value)}
                                    />
                                    <InputError message={errors.due_at} />
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
                                    Rent out
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

RentalsCheckout.layout = {
    breadcrumbs: [{ title: 'Rent out', href: rentalsCheckout() }],
};
