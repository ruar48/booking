import { Head, Link, useForm } from '@inertiajs/react';
import { AlertTriangle, FileCheck } from 'lucide-react';
import type { FormEvent } from 'react';

import InputError from '@/components/input-error';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { index as paymentsIndex, markPaid, markRefunded } from '@/routes/payments';
import type { Payment, PaymentAgreement } from '@/types/booking';

type Props = {
    payment: Payment;
    canMarkRefunded: boolean;
};

export default function PaymentsShow({ payment, canMarkRefunded }: Props) {
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

                {payment.flagged_at ? <RefundCard payment={payment} canMarkRefunded={canMarkRefunded} /> : null}

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

                    {payment.status !== 'paid' && payment.status !== 'refunded' ? (
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

                    {payment.agreed_at && payment.agreement ? (
                        <AgreementCard agreedAt={payment.agreed_at} agreement={payment.agreement} />
                    ) : null}
                </div>
            </div>
        </>
    );
}

/**
 * What the customer agreed to before paying online, recorded by the server
 * when they generated the QR: the record to point to in a dispute.
 */
function AgreementCard({ agreedAt, agreement }: { agreedAt: string; agreement: PaymentAgreement }) {
    const rows: [string, string][] = [
        ['Agreed at', formatDateTime(agreedAt)],
        ...agreement.policies.map((policy): [string, string] => [policy.title, `Version ${policy.version}`]),
        ['Terms of Service', `Version ${agreement.terms_version}`],
        ['Privacy Notice', `Version ${agreement.privacy_version}`],
        ['IP address', agreement.ip ?? '—'],
        ['Browser', agreement.user_agent ?? '—'],
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileCheck className="size-5 text-emerald-600" />
                    Agreed at checkout
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
                {rows.map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-4">
                        <span className="text-muted-foreground shrink-0">{label}</span>
                        <span className="min-w-0 text-right wrap-break-word">{value}</span>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

/**
 * A payment the system flagged — duplicate, paid after cancellation, or an
 * amount mismatch. Staff refund it in the PayMongo dashboard, then record it
 * here so it leaves the "needs refund" list.
 */
function RefundCard({ payment, canMarkRefunded }: { payment: Payment; canMarkRefunded: boolean }) {
    const { data, setData, patch, processing, errors } = useForm({ notes: '' });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        patch(markRefunded(payment).url, { preserveScroll: true });
    };

    return (
        <Card className="border-destructive/30 bg-destructive/5">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="size-5" />
                    Needs refund / review
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
                <p>{payment.notes}</p>
                <p className="text-muted-foreground">
                    Refund {formatCurrency(payment.amount)} to the customer from the PayMongo dashboard first, then record it
                    here.
                </p>
                {canMarkRefunded ? (
                    <form onSubmit={submit} className="space-y-3">
                        <div className="grid gap-2">
                            <Label htmlFor="refund_notes">Refund reference (optional)</Label>
                            <Input
                                id="refund_notes"
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                placeholder="e.g. PayMongo refund ID"
                            />
                            <InputError message={errors.notes} />
                        </div>
                        <Button type="submit" variant="destructive" disabled={processing}>
                            Record as refunded
                        </Button>
                    </form>
                ) : null}
            </CardContent>
        </Card>
    );
}

PaymentsShow.layout = {
    breadcrumbs: [{ title: 'Payments', href: paymentsIndex() }],
};
