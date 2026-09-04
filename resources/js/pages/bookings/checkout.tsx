import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    Check,
    CheckCircle2,
    MapPin,
    PartyPopper,
    QrCode,
    ShieldCheck,
    Smartphone,
    Wallet,
    XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { StatusBadge } from '@/components/status-badge';
import { useBookingPaymentChannel } from '@/hooks/use-booking-payment-channel';
import { formatCurrency, formatDate, formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { cancel as bookingsCancel, create as bookingsCreate, index as bookingsIndex, show as bookingsShow } from '@/routes/bookings';
import checkoutActions from '@/routes/bookings/checkout';
import type { ResourceBooking } from '@/types/booking';

type QrPayment = {
    id: number;
    qrCodeUrl: string | null;
    expiresAt: string | null;
};

type CheckoutPolicy = {
    id: number;
    title: string;
    body: string;
};

type Props = {
    booking: ResourceBooking;
    canManage?: boolean;
    qrPayment?: QrPayment | null;
    paymentDeadline?: string | null;
    policies?: CheckoutPolicy[];
    // Present when this booking was submitted together with others (e.g. a
    // multi-hour or multi-court selection) — the whole group shares one
    // payment, so checkout must total and display all of them, not just
    // this one row.
    groupBookings?: ResourceBooking[] | null;
    groupTotalAmount?: number | null;
};

type Step = 1 | 2 | 3 | 4;

function useDeadlineCountdown(deadline: string | null | undefined) {
    const target = useMemo(() => (deadline ? new Date(deadline).getTime() : null), [deadline]);
    const [remainingMs, setRemainingMs] = useState(() => (target ? target - Date.now() : null));

    useEffect(() => {
        if (deadline) {
            console.log('[checkout] deadline received', {
                raw: deadline,
                parsed: new Date(deadline).toISOString(),
                now: new Date().toISOString(),
                remainingMs: target ? target - Date.now() : null,
            });
        }
    }, [deadline, target]);

    useEffect(() => {
        if (!target) {
            return;
        }

        const interval = window.setInterval(() => {
            setRemainingMs(target - Date.now());
        }, 1000);

        return () => window.clearInterval(interval);
    }, [target]);

    if (remainingMs === null) {
        return { remainingMs: null, expired: false, label: null as string | null };
    }

    const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return {
        remainingMs,
        expired: remainingMs <= 0,
        label: `${minutes}:${String(seconds).padStart(2, '0')}`,
    };
}

export default function BookingsCheckout({
    booking,
    qrPayment = null,
    paymentDeadline = null,
    policies = [],
    groupBookings = null,
    groupTotalAmount = null,
}: Props) {
    const isPaid = booking.payment_status === 'paid';
    const isCancelled = booking.status === 'cancelled';
    const isUnpaid = booking.payment_status === 'unpaid' && !isCancelled;
    const amountDue = groupTotalAmount ?? booking.amount;

    const [step, setStep] = useState<Step>(() => {
        if (isPaid) return 4;
        // A QR record (even an expired one) means the customer already
        // started paying — a refresh should keep them on the payment step
        // with a "generate new QR" prompt, not bounce them back to step 1.
        if (qrPayment) return 3;
        return 1;
    });
    const [agreed, setAgreed] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

    const qrExpiry = useDeadlineCountdown(qrPayment?.expiresAt ?? null);
    const qrExpired = qrPayment ? qrExpiry.expired : false;

    useBookingPaymentChannel(isUnpaid ? booking.id : null);

    // Whatever step the customer is on, a confirmed payment always throws them to
    // the confirmation step — same as PayMongo/GCash's own hosted flow.
    useEffect(() => {
        if (isPaid) {
            setStep(4);
        }
    }, [isPaid]);

    const deadline = useDeadlineCountdown(step === 1 || step === 3 ? paymentDeadline : null);

    useEffect(() => {
        if (deadline.expired) {
            router.reload({ only: ['booking'] });
        }
    }, [deadline.expired]);

    const generateQr = () => {
        setGenerating(true);
        router.post(
            checkoutActions.generate({ booking: booking.id }).url,
            { payment_method: 'qrph' },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => setStep(3),
                onFinish: () => setGenerating(false),
            },
        );
    };

    const refresh = (label: string) => {
        setRefreshing(true);
        router.reload({
            only: ['booking', 'qrPayment'],
            onSuccess: (page) => {
                const updated = page.props.booking as ResourceBooking;
                if (updated.payment_status === 'unpaid') {
                    toast.info(`${label} — payment not received yet.`);
                }
            },
            onFinish: () => setRefreshing(false),
        });
    };

    const confirmCancelBooking = () => {
        setCancelDialogOpen(false);
        setCancelling(true);
        router.patch(
            bookingsCancel({ booking: booking.id }).url,
            { cancellation_reason: 'Cancelled by customer during checkout' },
            {
                onError: () => toast.error("Couldn't cancel this booking. Please try again."),
                onFinish: () => setCancelling(false),
            },
        );
    };

    return (
        <>
            <Head title={`Checkout — Booking #${booking.id}`} />
            <div className="flex flex-1 flex-col gap-3 p-3 pb-20 md:pb-3 lg:gap-6 lg:p-4">
                <div className="flex items-center gap-3">
                    <Button variant="outline" asChild size="sm">
                        <Link href={bookingsShow(booking)}>← Back</Link>
                    </Button>
                    <div className="min-w-0">
                        <h1 className="truncate text-lg font-semibold tracking-tight lg:text-2xl">Checkout</h1>
                    </div>
                </div>

                {isCancelled ? (
                    <CancelledPanel />
                ) : (
                    <>
                        <StepIndicator step={step} />

                        <div className="mx-auto w-full max-w-xl">
                            {step === 1 ? (
                                <BookingDetailsCard
                                    booking={booking}
                                    groupBookings={groupBookings}
                                    groupTotalAmount={groupTotalAmount}
                                    showDeadline={Boolean(paymentDeadline)}
                                    deadlineLabel={deadline.label}
                                    onContinue={() => setStep(2)}
                                />
                            ) : step === 2 ? (
                                <MethodAndPolicyPanel
                                    policies={policies}
                                    agreed={agreed}
                                    onAgreedChange={setAgreed}
                                    generating={generating}
                                    onBack={() => setStep(1)}
                                    onContinue={generateQr}
                                />
                            ) : step === 3 ? (
                                <PaymentPanel
                                    amount={amountDue}
                                    qrPayment={qrPayment}
                                    qrExpired={qrExpired}
                                    generating={generating}
                                    refreshing={refreshing}
                                    cancelling={cancelling}
                                    countdownLabel={deadline.label}
                                    onRefresh={refresh}
                                    onGenerateNew={generateQr}
                                    onCancel={() => setCancelDialogOpen(true)}
                                />
                            ) : (
                                <ConfirmationPanel booking={booking} amount={amountDue} />
                            )}
                        </div>

                        {step !== 4 ? (
                            <Card className="border-emerald-500/20 bg-emerald-500/5 mx-auto w-full max-w-xl py-0">
                                <CardContent className="flex items-center gap-2.5 p-3">
                                    <ShieldCheck className="size-4.5 shrink-0 text-emerald-600" />
                                    <div>
                                        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                                            Secure &amp; Safe Payment
                                        </p>
                                        <p className="text-muted-foreground text-[11px]">
                                            We do not store your card or wallet information.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : null}

                        <CancelBookingDialog
                            open={cancelDialogOpen}
                            cancelling={cancelling}
                            onOpenChange={setCancelDialogOpen}
                            onConfirm={confirmCancelBooking}
                        />
                    </>
                )}
            </div>
        </>
    );
}

function CancelBookingDialog({
    open,
    cancelling,
    onOpenChange,
    onConfirm,
}: {
    open: boolean;
    cancelling: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
}) {
    return (
        <Dialog open={open} onOpenChange={(next) => (cancelling ? null : onOpenChange(next))}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader className="items-center text-center sm:items-center sm:text-center">
                    <div className="bg-destructive/10 text-destructive flex size-11 items-center justify-center rounded-full">
                        <AlertTriangle className="size-5.5" />
                    </div>
                    <DialogTitle>Cancel this booking?</DialogTitle>
                    <DialogDescription>
                        This will release your court reservation and this action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="sm:justify-center">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={cancelling}>
                        Keep booking
                    </Button>
                    <Button variant="destructive" onClick={onConfirm} disabled={cancelling}>
                        {cancelling ? 'Cancelling…' : 'Yes, cancel booking'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function BookingDetailsCard({
    booking,
    groupBookings,
    groupTotalAmount,
    showDeadline,
    deadlineLabel,
    onContinue,
}: {
    booking: ResourceBooking;
    groupBookings?: ResourceBooking[] | null;
    groupTotalAmount?: number | null;
    showDeadline: boolean;
    deadlineLabel: string | null;
    onContinue: () => void;
}) {
    const isGrouped = groupBookings != null && groupBookings.length > 1;

    return (
        <Card className="gap-3 py-4">
            <CardHeader className="px-4">
                <div className="flex items-center gap-2.5">
                    <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
                        <MapPin className="size-4.5" />
                    </div>
                    <div className="min-w-0">
                        <CardTitle className="flex items-center gap-2 text-base">
                            {isGrouped ? `Court Booking (${groupBookings.length} slots)` : `Court Booking #${booking.id}`}
                            <StatusBadge status={booking.status} />
                        </CardTitle>
                        <p className="text-muted-foreground text-xs">{booking.resource?.name ?? 'Court'}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-3 px-4">
                {isGrouped ? (
                    <div className="space-y-2">
                        {groupBookings.map((slot) => (
                            <div key={slot.id} className="border-border/60 rounded-md border px-2.5 py-2 text-xs">
                                <div className="flex items-center justify-between font-medium">
                                    <span>{slot.resource?.name ?? 'Court'}</span>
                                    <span>{slot.amount != null ? formatCurrency(slot.amount) : '—'}</span>
                                </div>
                                <p className="text-muted-foreground">
                                    {formatDate(slot.starts_at)} · {formatTime(slot.starts_at)} – {formatTime(slot.ends_at)}
                                </p>
                            </div>
                        ))}
                        <SummaryRow label="Total Amount">
                            {groupTotalAmount != null ? formatCurrency(groupTotalAmount) : '—'}
                        </SummaryRow>
                    </div>
                ) : (
                    <div>
                        <SummaryRow label="Date">{formatDate(booking.starts_at)}</SummaryRow>
                        <SummaryRow label="Time">
                            {formatTime(booking.starts_at)} – {formatTime(booking.ends_at)}
                        </SummaryRow>
                        <SummaryRow label="Court">{booking.resource?.name ?? '—'}</SummaryRow>
                        <SummaryRow label="Amount">
                            {booking.amount != null ? formatCurrency(booking.amount) : '—'}
                        </SummaryRow>
                    </div>
                )}

                {showDeadline ? (
                    <div className="bg-amber-500/10 border-amber-500/20 rounded-md border p-2.5 text-xs">
                        <p className="font-medium text-amber-700 dark:text-amber-400">
                            Complete payment within {deadlineLabel ?? '—'}
                        </p>
                        <p className="text-muted-foreground">
                            Automatically cancelled if payment isn&apos;t received in time.
                        </p>
                    </div>
                ) : null}

                <Button className="w-full" onClick={onContinue}>
                    Continue
                </Button>
            </CardContent>
        </Card>
    );
}

function MethodAndPolicyPanel({
    policies,
    agreed,
    onAgreedChange,
    generating,
    onBack,
    onContinue,
}: {
    policies: { id: number; title: string; body: string }[];
    agreed: boolean;
    onAgreedChange: (value: boolean) => void;
    generating: boolean;
    onBack: () => void;
    onContinue: () => void;
}) {
    const requiresAgreement = policies.length > 0;
    const [policiesOpen, setPoliciesOpen] = useState(false);

    return (
        <Card className="gap-3 py-4">
            <CardHeader className="px-4">
                <CardTitle className="text-base">Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-4">
                <div className="grid grid-cols-3 gap-2">
                    <PaymentOption icon={QrCode} label="QR Ph" description="Any bank or e-wallet" selected />
                    <PaymentOption icon={Smartphone} label="GCash" description="Coming soon" disabled />
                    <PaymentOption icon={Wallet} label="Maya" description="Coming soon" disabled />
                </div>

                {requiresAgreement ? (
                    <>
                        {/* One line instead of the full policy text: the wording
                            opens a dialog, and checkout stays blocked until the
                            box is ticked. */}
                        <label className="hover:bg-muted/50 flex items-start gap-2.5 rounded-lg border p-3 text-sm transition-colors">
                            <Checkbox
                                className="mt-0.5"
                                checked={agreed}
                                onCheckedChange={(checked) =>
                                    onAgreedChange(checked === true)
                                }
                            />
                            <span className="leading-snug">
                                I have read and agree to the{' '}
                                <button
                                    type="button"
                                    onClick={(event) => {
                                        // Inside a label, so stop the click from
                                        // toggling the checkbox as well.
                                        event.preventDefault();
                                        event.stopPropagation();
                                        setPoliciesOpen(true);
                                    }}
                                    className="text-primary decoration-primary/40 hover:decoration-primary font-medium underline underline-offset-2 transition-colors"
                                >
                                    Payment &amp; Refund Policy
                                </button>
                                .
                            </span>
                        </label>

                        <PolicyDialog
                            open={policiesOpen}
                            onOpenChange={setPoliciesOpen}
                            policies={policies}
                            agreed={agreed}
                            onAgree={() => {
                                onAgreedChange(true);
                                setPoliciesOpen(false);
                            }}
                        />
                    </>
                ) : null}

                <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={onBack} disabled={generating}>
                        Back
                    </Button>
                    <Button
                        className="flex-1"
                        onClick={onContinue}
                        disabled={(requiresAgreement && !agreed) || generating}
                    >
                        {generating ? 'Generating QR…' : 'Continue to Payment'}
                    </Button>
                </div>

                {requiresAgreement && !agreed ? (
                    <p className="text-muted-foreground text-center text-xs">
                        Accept the policy to continue.
                    </p>
                ) : null}
            </CardContent>
        </Card>
    );
}

function PolicyDialog({
    open,
    onOpenChange,
    policies,
    agreed,
    onAgree,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    policies: { id: number; title: string; body: string }[];
    agreed: boolean;
    onAgree: () => void;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShieldCheck className="text-primary size-5" />
                        Payment &amp; Refund Policy
                    </DialogTitle>
                    <DialogDescription>
                        Please read these before continuing to payment.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {policies.map((policy) => (
                        <div key={policy.id} className="space-y-1.5">
                            {/* With a single policy its title duplicates the
                                dialog heading, so only label them when there
                                is more than one to tell apart. */}
                            {policies.length > 1 ? (
                                <p className="text-sm font-semibold">
                                    {policy.title}
                                </p>
                            ) : null}
                            <ul className="text-muted-foreground list-outside list-disc space-y-1.5 pl-4 text-sm">
                                {policy.body
                                    .split('\n')
                                    .map((line) => line.trim())
                                    .filter(Boolean)
                                    .map((line, index) => (
                                        <li key={index}>{line}</li>
                                    ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <DialogFooter className="gap-2 sm:justify-end">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                    {!agreed ? (
                        <Button onClick={onAgree}>
                            <Check className="size-4" />
                            I agree
                        </Button>
                    ) : null}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function PaymentOption({
    icon: Icon,
    label,
    description,
    selected = false,
    disabled = false,
}: {
    icon: typeof QrCode;
    label: string;
    description: string;
    selected?: boolean;
    disabled?: boolean;
}) {
    return (
        <div
            className={cn(
                'relative flex flex-col items-center gap-1 rounded-lg border p-2 text-center',
                disabled ? 'opacity-50' : '',
                selected && !disabled ? 'border-primary ring-primary/20 ring-2' : 'border-border',
            )}
        >
            {disabled ? (
                <Badge variant="outline" className="absolute -top-2 -right-2 text-[8px] px-1">
                    Soon
                </Badge>
            ) : null}
            <Icon className="text-primary size-4.5" />
            <div>
                <p className="text-[11px] font-medium">{label}</p>
                <p className="text-muted-foreground hidden text-[10px] sm:block">{description}</p>
            </div>
        </div>
    );
}

function PaymentPanel({
    amount,
    qrPayment,
    qrExpired,
    generating,
    refreshing,
    cancelling,
    countdownLabel,
    onRefresh,
    onGenerateNew,
    onCancel,
}: {
    amount?: number | null;
    qrPayment: QrPayment | null;
    qrExpired: boolean;
    generating: boolean;
    refreshing: boolean;
    cancelling: boolean;
    countdownLabel: string | null;
    onRefresh: (label: string) => void;
    onGenerateNew: () => void;
    onCancel: () => void;
}) {
    const showExpired = qrExpired && !generating;

    return (
        <Card className="gap-3 py-4">
            <CardHeader className="px-4">
                <CardTitle className="text-base">Pay with QR Ph</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-4">
                <div className="flex flex-col items-center gap-2">
                    {showExpired ? (
                        <div className="text-muted-foreground flex aspect-square w-full max-w-72 flex-col items-center justify-center gap-2 rounded-lg border text-center text-sm">
                            <span>QR code expired</span>
                            <Button size="sm" onClick={onGenerateNew} disabled={generating}>
                                Generate new QR
                            </Button>
                        </div>
                    ) : qrPayment?.qrCodeUrl ? (
                        <img
                            src={qrPayment.qrCodeUrl}
                            alt="QR Ph payment code"
                            className="aspect-square w-full max-w-72 rounded-lg border p-2"
                        />
                    ) : (
                        <div className="text-muted-foreground flex aspect-square w-full max-w-72 items-center justify-center rounded-lg border text-sm">
                            {generating ? 'Generating QR…' : 'Preparing payment…'}
                        </div>
                    )}
                    {countdownLabel && !showExpired ? (
                        <p className="text-muted-foreground text-center text-xs">
                            Complete within{' '}
                            <span className="text-foreground font-medium">{countdownLabel}</span>
                        </p>
                    ) : null}
                </div>

                <div className="bg-amber-500/10 border-amber-500/20 space-y-1 rounded-md border p-2.5 text-xs">
                    <p className="font-medium text-amber-700 dark:text-amber-400">Payment Instructions:</p>
                    <ol className="text-muted-foreground list-inside list-decimal space-y-0.5">
                        <li>Open your GCash or e-wallet app and tap Scan QR.</li>
                        <li>Scan the QR code above.</li>
                        <li>
                            Confirm the amount{amount != null ? ` (${formatCurrency(amount)})` : ''}.
                        </li>
                    </ol>
                </div>

                {!showExpired ? (
                    <div className="flex items-center justify-center gap-2 rounded-md bg-slate-50 py-2.5 text-xs font-medium text-slate-500">
                        <span className="size-1.5 animate-pulse rounded-full bg-slate-400" />
                        Waiting for payment — this page updates automatically once it&apos;s received.
                    </div>
                ) : null}
                <div className="flex items-center justify-center gap-3">
                    <button
                        type="button"
                        disabled={refreshing}
                        onClick={() => onRefresh('Refresh')}
                        className="text-muted-foreground hover:text-foreground text-xs disabled:opacity-50"
                    >
                        {refreshing ? 'Checking…' : 'Refresh status'}
                    </button>
                    <span className="text-muted-foreground text-xs">·</span>
                    <button
                        type="button"
                        disabled={cancelling}
                        onClick={onCancel}
                        className="text-destructive/80 hover:text-destructive text-xs disabled:opacity-50"
                    >
                        {cancelling ? 'Cancelling…' : 'Cancel booking'}
                    </button>
                </div>
            </CardContent>
        </Card>
    );
}

function ConfirmationPanel({ booking, amount }: { booking: ResourceBooking; amount?: number | null }) {
    return (
        <Card className="border-emerald-500/20">
            <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
                <PartyPopper className="size-14 text-emerald-500" />
                <p className="text-lg font-semibold">Payment Successful!</p>
                <p className="text-muted-foreground text-sm">
                    {amount != null ? `${formatCurrency(amount)} paid. ` : ''}
                    Your reservation is confirmed — see you on the court.
                </p>
                <Button asChild className="mt-2">
                    <Link href={bookingsShow(booking)}>View booking</Link>
                </Button>
            </CardContent>
        </Card>
    );
}

function CancelledPanel() {
    return (
        <Card className="border-destructive/20">
            <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
                <XCircle className="text-destructive size-14" />
                <p className="text-lg font-semibold">This booking was cancelled</p>
                <p className="text-muted-foreground text-sm">
                    Payment wasn&apos;t completed in time, so this reservation was released.
                </p>
                <Button asChild className="mt-2">
                    <Link href={bookingsCreate()}>Book again</Link>
                </Button>
            </CardContent>
        </Card>
    );
}

function StepIndicator({ step }: { step: Step }) {
    const steps = [
        { number: 1, label: 'Booking Details' },
        { number: 2, label: 'Payment Method' },
        { number: 3, label: 'Pay' },
        { number: 4, label: 'Confirmation' },
    ];

    return (
        <div className="mx-auto flex w-full max-w-xl items-center">
            {steps.map((s, index) => (
                <div key={s.number} className="flex flex-1 items-center last:flex-none">
                    <div className="flex flex-col items-center gap-1">
                        <div
                            className={cn(
                                'flex size-6 items-center justify-center rounded-full text-xs font-semibold lg:size-8 lg:text-sm',
                                s.number <= step
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-muted text-muted-foreground',
                            )}
                        >
                            {s.number < step ? <CheckCircle2 className="size-3.5 lg:size-4" /> : s.number}
                        </div>
                        <span
                            className={cn(
                                'text-[10px] whitespace-nowrap lg:text-xs',
                                s.number <= step ? 'font-medium' : 'text-muted-foreground',
                            )}
                        >
                            {s.label}
                        </span>
                    </div>
                    {index < steps.length - 1 ? (
                        <div
                            className={cn(
                                'mx-1.5 h-0.5 flex-1 lg:mx-2',
                                s.number < step ? 'bg-emerald-500' : 'bg-muted',
                            )}
                        />
                    ) : null}
                </div>
            ))}
        </div>
    );
}

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-4 border-b py-1.5 text-sm last:border-0">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium">{children}</span>
        </div>
    );
}

BookingsCheckout.layout = {
    breadcrumbs: [{ title: 'Bookings', href: bookingsIndex() }],
};
