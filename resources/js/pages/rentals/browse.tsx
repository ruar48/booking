import { Head, Link, router } from '@inertiajs/react';
import { Dumbbell, ListOrdered, Minus, Plus } from 'lucide-react';
import { useState } from 'react';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/format';
import { browse as rentalsBrowse, mine as rentalsMine, rent } from '@/routes/rentals';
import type { RentalItem } from '@/types/rentals';

type Props = {
    rentalItems: RentalItem[];
};

export default function RentalsBrowse({ rentalItems }: Props) {
    return (
        <>
            <Head title="Rentals" />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <PageHeader
                    title="Rentals"
                    description="Rent paddles, balls, and other equipment for your session."
                    actions={
                        <Button variant="outline" asChild>
                            <Link href={rentalsMine()}>
                                <ListOrdered className="size-4" />
                                My rentals
                            </Link>
                        </Button>
                    }
                />

                {rentalItems.length === 0 ? (
                    <Card>
                        <CardContent className="text-muted-foreground py-16 text-center text-sm">
                            No rental items are available right now.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {rentalItems.map((rentalItem) => (
                            <RentalItemCard key={rentalItem.id} rentalItem={rentalItem} />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

function RentalItemCard({ rentalItem }: { rentalItem: RentalItem }) {
    const [quantity, setQuantity] = useState(1);
    const [processing, setProcessing] = useState(false);

    const outOfStock = rentalItem.available_quantity <= 0;

    const submit = () => {
        router.post(
            rent().url,
            { rental_item_id: rentalItem.id, quantity },
            {
                preserveScroll: true,
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
                onSuccess: () => setQuantity(1),
            },
        );
    };

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base">{rentalItem.name}</CardTitle>
                <p className="text-xs text-muted-foreground">
                    {rentalItem.category ?? 'Uncategorized'}
                </p>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Rate</span>
                    <span className="font-semibold">{formatCurrency(rentalItem.rate)}</span>
                </div>
                {rentalItem.deposit != null && Number(rentalItem.deposit) > 0 && (
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Deposit</span>
                        <span>{formatCurrency(rentalItem.deposit)}</span>
                    </div>
                )}
                <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Available</span>
                    <span>{outOfStock ? 'Out of stock' : `${rentalItem.available_quantity} left`}</span>
                </div>

                {outOfStock ? (
                    <Button className="w-full" disabled>
                        Out of stock
                    </Button>
                ) : (
                    <div className="flex items-center gap-2 pt-1">
                        <div className="flex items-center gap-1">
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="size-8"
                                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                            >
                                <Minus className="size-3" />
                            </Button>
                            <span className="w-6 text-center">{quantity}</span>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="size-8"
                                disabled={quantity >= rentalItem.available_quantity}
                                onClick={() =>
                                    setQuantity((q) => Math.min(rentalItem.available_quantity, q + 1))
                                }
                            >
                                <Plus className="size-3" />
                            </Button>
                        </div>
                        <Button className="flex-1" disabled={processing} onClick={submit}>
                            <Dumbbell className="size-4" />
                            Rent
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

RentalsBrowse.layout = {
    breadcrumbs: [{ title: 'Rentals', href: rentalsBrowse() }],
};
