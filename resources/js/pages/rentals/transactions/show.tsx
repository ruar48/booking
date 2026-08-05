import { Head, router } from '@inertiajs/react';
import { CalendarCheck, PackageCheck } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';

import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { formatDurationLabel, formatReservedForLabel } from '@/lib/rental-display';
import {
    approve as approveRoute,
    index as transactionsIndex,
    returnItems as returnItemsRoute,
} from '@/routes/rentals/transactions';
import type { RentalTransaction } from '@/types/rentals';

type Props = {
    transaction: RentalTransaction;
};

export default function RentalTransactionShow({ transaction }: Props) {
    const items = transaction.items ?? [];

    const outstandingByItem = useMemo(
        () =>
            Object.fromEntries(
                items.map((item) => [item.id, item.quantity - item.quantity_returned]),
            ),
        [items],
    );

    const [returnQuantities, setReturnQuantities] = useState<Record<number, number>>(
        Object.fromEntries(items.map((item) => [item.id, outstandingByItem[item.id] ?? 0])),
    );
    const [processing, setProcessing] = useState(false);

    const canReturn = transaction.status === 'active' || transaction.status === 'overdue';
    const isReserved = transaction.status === 'reserved';

    const approve = () => {
        router.post(
            approveRoute(transaction).url,
            {},
            {
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
            },
        );
    };

    const setQuantity = (itemId: number, value: number, max: number) => {
        setReturnQuantities((prev) => ({
            ...prev,
            [itemId]: Math.max(0, Math.min(value, max)),
        }));
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();

        const payload = items
            .map((item) => ({
                rental_transaction_item_id: item.id,
                quantity_returned: returnQuantities[item.id] ?? 0,
            }))
            .filter((line) => line.quantity_returned > 0);

        if (payload.length === 0) {
            return;
        }

        router.patch(
            returnItemsRoute(transaction).url,
            { items: payload },
            {
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <>
            <Head title={transaction.reference_number} />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <PageHeader
                    title={transaction.reference_number}
                    description={formatDateTime(transaction.rented_at)}
                    actions={<StatusBadge status={transaction.status} />}
                />

                <div className="grid gap-4 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit}>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Item</TableHead>
                                            <TableHead className="text-right">Rented</TableHead>
                                            <TableHead className="text-right">Returned</TableHead>
                                            <TableHead className="text-right">Rate</TableHead>
                                            {canReturn && (
                                                <TableHead className="text-right">Return now</TableHead>
                                            )}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.map((item) => {
                                            const outstanding = outstandingByItem[item.id] ?? 0;

                                            return (
                                                <TableRow key={item.id}>
                                                    <TableCell>{item.rental_item_name}</TableCell>
                                                    <TableCell className="text-right">
                                                        {item.quantity}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {item.quantity_returned}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {formatCurrency(item.rate)}
                                                    </TableCell>
                                                    {canReturn && (
                                                        <TableCell className="text-right">
                                                            {outstanding > 0 ? (
                                                                <Input
                                                                    type="number"
                                                                    min={0}
                                                                    max={outstanding}
                                                                    className="ml-auto w-20 text-right"
                                                                    value={
                                                                        returnQuantities[item.id] ?? 0
                                                                    }
                                                                    onChange={(e) =>
                                                                        setQuantity(
                                                                            item.id,
                                                                            Number(e.target.value),
                                                                            outstanding,
                                                                        )
                                                                    }
                                                                />
                                                            ) : (
                                                                <span className="text-muted-foreground">
                                                                    Fully returned
                                                                </span>
                                                            )}
                                                        </TableCell>
                                                    )}
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>

                                <div className="mt-4 ml-auto max-w-xs space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Deposit</span>
                                        <span>{formatCurrency(transaction.deposit_amount)}</span>
                                    </div>
                                    <div className="flex justify-between text-base font-semibold">
                                        <span>Total</span>
                                        <span>{formatCurrency(transaction.total_amount)}</span>
                                    </div>
                                </div>

                                {transaction.notes && (
                                    <p className="mt-4 text-sm text-muted-foreground">
                                        Notes: {transaction.notes}
                                    </p>
                                )}

                                {canReturn && (
                                    <Button type="submit" className="mt-4" disabled={processing}>
                                        <PackageCheck className="size-4" />
                                        Mark returned
                                    </Button>
                                )}

                                {isReserved && (
                                    <div className="mt-4 space-y-2">
                                        <p className="text-muted-foreground text-sm">
                                            Reserved for{' '}
                                            <span className="text-foreground font-medium">
                                                {formatReservedForLabel(transaction.reserved_for)}
                                            </span>
                                            . Approving will check current stock and check the
                                            equipment out immediately.
                                        </p>
                                        <Button type="button" onClick={approve} disabled={processing}>
                                            <CalendarCheck className="size-4" />
                                            Approve reservation
                                        </Button>
                                    </div>
                                )}
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Staff</span>
                                <span>{transaction.staff?.name ?? '—'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Renter</span>
                                <span>
                                    {transaction.renter?.name ?? transaction.renter_name ?? 'Walk-in'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Duration</span>
                                <span>{formatDurationLabel(transaction)}</span>
                            </div>
                            {isReserved ? (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Reserved for</span>
                                    <span>{formatReservedForLabel(transaction.reserved_for)}</span>
                                </div>
                            ) : (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Due back</span>
                                    <span>{formatDateTime(transaction.due_at)}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Returned at</span>
                                <span>{formatDateTime(transaction.returned_at)}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

RentalTransactionShow.layout = {
    breadcrumbs: [
        { title: 'Rental transactions', href: transactionsIndex() },
        { title: 'Receipt', href: transactionsIndex() },
    ],
};
