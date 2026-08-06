import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

import InputError from '@/components/input-error';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { index as paymentsIndex, markPaid } from '@/routes/payments';
import { formatCurrency, formatDateTime } from '@/lib/format';
import type { Payment } from '@/types/booking';

type Props = {
    payment: Payment;
};

export default function PaymentsShow({ payment }: Props) {
    const { data, setData, patch, processing, errors } = useForm({
        payment_method: payment.payment_method ?? '',
        notes: payment.notes ?? '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        patch(markPaid(payment).url, { preserveScroll: true });
    };

    return (
        <>
            <Head title={`Payment #${payment.id}`} />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <PageHeader
                    title={`Payment #${payment.id}`}
                    description={payment.user?.name}
                    actions={
                        <Button variant="outline" asChild>
                            <Link href={paymentsIndex()}>Back</Link>
                        </Button>
                    }
                />

                <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Payment details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Status</span>
                                <StatusBadge status={payment.status} />
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Amount</span>
                                <span className="font-semibold">
                                    {formatCurrency(payment.amount)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">User</span>
                                <span>{payment.user?.email}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Type</span>
                                <span>
                                    {payment.payable_type.split('\\').pop()}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Created</span>
                                <span>{formatDateTime(payment.created_at)}</span>
                            </div>
                            {payment.paid_at ? (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Paid at</span>
                                    <span>{formatDateTime(payment.paid_at)}</span>
                                </div>
                            ) : null}
                        </CardContent>
                    </Card>

                    {payment.status !== 'paid' ? (
                        <Card>
                            <CardHeader>
                                <CardTitle>Mark as paid</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={submit} className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="payment_method">
                                            Payment method
                                        </Label>
                                        <Input
                                            id="payment_method"
                                            value={data.payment_method}
                                            onChange={(e) =>
                                                setData('payment_method', e.target.value)
                                            }
                                            placeholder="e.g. cash, card, transfer"
                                        />
                                        <InputError message={errors.payment_method} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="notes">Notes</Label>
                                        <Textarea
                                            id="notes"
                                            value={data.notes}
                                            onChange={(e) =>
                                                setData('notes', e.target.value)
                                            }
                                            rows={3}
                                        />
                                    </div>
                                    <Button type="submit" disabled={processing}>
                                        Mark as paid
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardHeader>
                                <CardTitle>Notes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground text-sm">
                                    {payment.notes ?? 'No notes'}
                                </p>
                                {payment.payment_method ? (
                                    <p className="mt-2 text-sm">
                                        Method: {payment.payment_method}
                                    </p>
                                ) : null}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </>
    );
}

PaymentsShow.layout = {
    breadcrumbs: [{ title: 'Payments', href: paymentsIndex() }],
};
