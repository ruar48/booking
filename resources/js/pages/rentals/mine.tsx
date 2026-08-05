import { Head, Link } from '@inertiajs/react';
import { Dumbbell } from 'lucide-react';

import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { browse as rentalsBrowse, mine as rentalsMine } from '@/routes/rentals';
import type { RentalTransaction } from '@/types/rentals';

type Props = {
    transactions: RentalTransaction[];
};

export default function RentalsMine({ transactions }: Props) {
    return (
        <>
            <Head title="My Rentals" />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <PageHeader
                    title="My rentals"
                    description="Equipment you've rented and its return status"
                    actions={
                        <Button asChild>
                            <Link href={rentalsBrowse()}>
                                <Dumbbell className="size-4" />
                                Rent equipment
                            </Link>
                        </Button>
                    }
                />

                {transactions.length === 0 ? (
                    <Card>
                        <CardContent className="text-muted-foreground py-16 text-center text-sm">
                            You haven&apos;t rented any equipment yet.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {transactions.map((transaction) => (
                            <Card key={transaction.id}>
                                <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3">
                                    <div>
                                        <CardTitle className="text-base">
                                            {transaction.reference_number}
                                        </CardTitle>
                                        <p className="text-xs text-muted-foreground">
                                            {formatDateTime(transaction.rented_at)}
                                        </p>
                                    </div>
                                    <StatusBadge status={transaction.status} />
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm">
                                    {(transaction.items ?? []).map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center justify-between border-b pb-2 last:border-b-0 last:pb-0"
                                        >
                                            <span>
                                                {item.rental_item_name} × {item.quantity}
                                            </span>
                                            <span className="text-muted-foreground">
                                                {item.quantity_returned >= item.quantity
                                                    ? 'Returned'
                                                    : `${item.quantity - item.quantity_returned} outstanding`}
                                            </span>
                                        </div>
                                    ))}
                                    <div className="flex items-center justify-between pt-1">
                                        <span className="text-muted-foreground">Due back</span>
                                        <span>{formatDateTime(transaction.due_at)}</span>
                                    </div>
                                    <div className="flex items-center justify-between font-semibold">
                                        <span>Total</span>
                                        <span>{formatCurrency(transaction.total_amount)}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

RentalsMine.layout = {
    breadcrumbs: [{ title: 'My rentals', href: rentalsMine() }],
};
