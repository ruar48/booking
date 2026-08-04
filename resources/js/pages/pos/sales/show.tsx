import { Head, Link, router } from '@inertiajs/react';
import { Ban } from 'lucide-react';

import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { index as salesIndex } from '@/routes/pos/sales';
import type { Sale } from '@/types/pos';

type Props = {
    sale: Sale;
};

export default function SaleShow({ sale }: Props) {
    const voidSale = () => {
        if (!confirm('Void this sale? Stock will be restored and the payment refunded.')) {
            return;
        }

        router.patch(`/pos/sales/${sale.id}/void`);
    };

    return (
        <>
            <Head title={`Sale ${sale.invoice_number}`} />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <PageHeader
                    title={sale.invoice_number}
                    description={formatDateTime(sale.created_at)}
                    actions={
                        <div className="flex items-center gap-2">
                            <StatusBadge status={sale.status} />
                            {sale.status === 'completed' && (
                                <Button variant="destructive" onClick={voidSale}>
                                    <Ban className="size-4" />
                                    Void sale
                                </Button>
                            )}
                        </div>
                    }
                />

                <div className="grid gap-4 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead className="text-right">Qty</TableHead>
                                        <TableHead className="text-right">Unit price</TableHead>
                                        <TableHead className="text-right">Line total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(sale.items ?? []).map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{item.product_name}</TableCell>
                                            <TableCell className="text-right">
                                                {item.quantity}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(item.unit_price)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(item.line_total)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            <div className="mt-4 ml-auto max-w-xs space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>{formatCurrency(sale.subtotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Discount</span>
                                    <span>-{formatCurrency(sale.discount)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Tax</span>
                                    <span>{formatCurrency(sale.tax)}</span>
                                </div>
                                <div className="flex justify-between text-base font-semibold">
                                    <span>Total</span>
                                    <span>{formatCurrency(sale.total)}</span>
                                </div>
                            </div>

                            {sale.notes && (
                                <p className="mt-4 text-sm text-muted-foreground">
                                    Notes: {sale.notes}
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Cashier</span>
                                <span>{sale.cashier?.name ?? '—'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Customer</span>
                                <span>{sale.customer?.name ?? 'Walk-in'}</span>
                            </div>
                            {(sale.payments ?? []).map((payment) => (
                                <div key={payment.id} className="border-t pt-3">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Payment</span>
                                        <StatusBadge status={payment.status} />
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Method</span>
                                        <span className="capitalize">
                                            {payment.payment_method ?? '—'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Amount</span>
                                        <span>{formatCurrency(payment.amount)}</span>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

SaleShow.layout = {
    breadcrumbs: [
        { title: 'Sales', href: salesIndex() },
        { title: 'Receipt', href: salesIndex() },
    ],
};
