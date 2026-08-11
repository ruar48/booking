import { Head, Link, router } from '@inertiajs/react';
import {
    Calendar,
    CheckCircle2,
    Clock,
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
import { StatusBadge } from '@/components/status-badge';
import { useBookingPaymentChannel } from '@/hooks/use-booking-payment-channel';
import { formatCurrency, formatDate, formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { create as bookingsCreate, index as bookingsIndex, show as bookingsShow } from '@/routes/bookings';
import checkoutActions from '@/routes/bookings/checkout';
import type { ResourceBooking } from '@/types/booking';

type QrPayment = {
    id: number;
    qrCodeUrl: string | null;
    expiresAt: string | null;
};

type Props = {
    booking: ResourceBooking;
    canManage?: boolean;
    qrPayment?: QrPayment | null;
    paymentDeadline?: string | null;
};

type Step = 1 | 2 | 3 | 4;

function useDeadlineCountdown(deadline: string | null | undefined) {
    const target = useMemo(() => (deadline ? new Date(deadline).getTime() : null), [deadline]);
    const [remainingMs, setRemainingMs] = useState(() => (target ? target - Date.now() : null));

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

export default function BookingsCheckout({ booking, qrPayment = null, paymentDeadline = null }: Props) {
    const isPaid = booking.payment_status === 'paid';
    const isCancelled = booking.status === 'cancelled';
    const isUnpaid = booking.payment_status === 'unpaid' && !isCancelled;

    const [step, setStep] = useState<Step>(() => {
        if (isPaid) return 4;
        if (qrPayment?.qrCodeUrl) return 3;
        return 1;
    });
    const [agreed, setAgreed] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

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

    return (
        <>
            <Head title={`Checkout — Booking #${booking.id}`} />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <div>
                    <Button variant="outline" asChild size="sm">
                        <Link href={bookingsShow(booking)}>← Back</Link>
                    </Button>
                </div>

                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Checkout</h1>
                    <p className="text-muted-foreground text-sm">
                        Complete your booking payment to confirm your reservation.
                    </p>
                </div>

                {isCancelled ? (
                    <CancelledPanel />
                ) : (
                    <>
                        <StepIndicator step={step} />

                        <div className="grid gap-4 lg:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
                                            <MapPin className="size-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                Court Booking #{booking.id}
                                                <StatusBadge status={booking.status} />
                                            </CardTitle>
                                            <p className="text-muted-foreground text-sm">
                                                {booking.resource?.name ?? 'Court'}
                                            </p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="bg-muted flex items-center gap-2 rounded-md p-3 text-sm font-medium">
                                        <Calendar className="size-4" />
                                        {formatDate(booking.starts_at)}
                                        <span className="text-muted-foreground">·</span>
                                        <Clock className="size-4" />
                                        {formatTime(booking.starts_at)} – {formatTime(booking.ends_at)}
                                    </div>

                                    <div>
                                        <p className="mb-2 text-sm font-semibold">Booking Summary</p>
                                        <SummaryRow label="Date">{formatDate(booking.starts_at)}</SummaryRow>
                                        <SummaryRow label="Time">
                                            {formatTime(booking.starts_at)} – {formatTime(booking.ends_at)}
                                        </SummaryRow>
                                        <SummaryRow label="Court">{booking.resource?.name ?? '—'}</SummaryRow>
                                        <SummaryRow label="Amount">
                                            {booking.amount != null ? formatCurrency(booking.amount) : '—'}
                                        </SummaryRow>
                                    </div>

                                    {step === 1 && paymentDeadline ? (
                                        <div className="bg-amber-500/10 border-amber-500/20 rounded-md border p-3 text-sm">
                                            <p className="font-medium text-amber-700 dark:text-amber-400">
                                                Complete payment within{' '}
                                                {deadline.label ?? '—'}
                                            </p>
                                            <p className="text-muted-foreground text-xs">
                                                This booking will be automatically cancelled if payment
                                                isn&apos;t received within that time.
                                            </p>
                                        </div>
                                    ) : null}
                                </CardContent>
                            </Card>

                            {step === 1 ? (
                                <ReadyPanel onContinue={() => setStep(2)} />
                            ) : step === 2 ? (
                                <MethodAndPolicyPanel
                                    agreed={agreed}
                                    onAgreedChange={setAgreed}
                                    generating={generating}
                                    onBack={() => setStep(1)}
                                    onContinue={generateQr}
                                />
                            ) : step === 3 ? (
                                <PaymentPanel
                                    amount={booking.amount}
                                    qrPayment={qrPayment}
                                    generating={generating}
                                    refreshing={refreshing}
                                    countdownLabel={deadline.label}
                                    onBack={() => setStep(2)}
                                    onRefresh={refresh}
                                />
                            ) : (
                                <ConfirmationPanel booking={booking} />
                            )}
                        </div>

                        {step !== 4 ? (
                            <Card className="border-emerald-500/20 bg-emerald-500/5">
                                <CardContent className="flex items-center gap-3 p-4">
                                    <ShieldCheck className="size-5 shrink-0 text-emerald-600" />
                                    <div>
                                        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                                            Secure &amp; Safe Payment
                                        </p>
                                        <p className="text-muted-foreground text-xs">
                                            Your payment is processed securely. We do not store your card
                                            or wallet information.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : null}
                    </>
                )}
            </div>
        </>
    );
}

function ReadyPanel({ onContinue }: { onContinue: () => void }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Booking Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm">
                    Your reservation is held while you complete payment. Review the details on the
                    left, then continue to choose how you&apos;d like to pay.
                </p>
                <Button className="w-full" onClick={onContinue}>
                    Continue
                </Button>
            </CardContent>
        </Card>
    );
}

function MethodAndPolicyPanel({
    agreed,
    onAgreedChange,
    generating,
    onBack,
    onContinue,
}: {
    agreed: boolean;
    onAgreedChange: (value: boolean) => void;
    generating: boolean;
    onBack: () => void;
    onContinue: () => void;
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                    <PaymentOption icon={QrCode} label="QR Ph" description="Any bank or e-wallet" selected />
                    <PaymentOption icon={Smartphone} label="GCash" description="Coming soon" disabled />
                    <PaymentOption icon={Wallet} label="Maya" description="Coming soon" disabled />
                </div>

                <Card className="bg-muted/40">
                    <CardContent className="space-y-2 p-4 text-sm">
                        <div className="flex items-center justify-between">
                            <p className="font-semibold">Payment &amp; Refund Policy</p>
                            <Badge variant="outline" className="text-[10px]">
                                Draft — subject to change
                            </Badge>
                        </div>
                        <ul className="text-muted-foreground list-inside list-disc space-y-1 text-xs">
                            <li>Your booking is confirmed only once payment is received in full.</li>
                            <li>
                                Payments are non-refundable once your booking is confirmed, except when
                                the venue cancels, reschedules, or cannot honor your reservation.
                            </li>
                            <li>
                                If payment isn&apos;t completed within the time shown, your booking is
                                automatically cancelled and you will not be charged.
                            </li>
                            <li>
                                For rescheduling requests or payment disputes, please contact the venue
                                directly.
                            </li>
                        </ul>
                        <label className="flex items-start gap-2 pt-2 text-sm">
                            <Checkbox
                                checked={agreed}
                                onCheckedChange={(checked) => onAgreedChange(checked === true)}
                            />
                            <span>I have read and agree to the payment terms above.</span>
                        </label>
                    </CardContent>
                </Card>

                <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={onBack} disabled={generating}>
                        Back
                    </Button>
                    <Button
                        className="flex-1"
                        onClick={onContinue}
                        disabled={!agreed || generating}
                    >
                        {generating ? 'Generating QR…' : 'Continue to Payment'}
                    </Button>
                </div>
            </CardContent>
        </Card>
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
                'relative flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center',
                disabled ? 'opacity-50' : '',
                selected && !disabled ? 'border-primary ring-primary/20 ring-2' : 'border-border',
            )}
        >
            {disabled ? (
                <Badge variant="outline" className="absolute -top-2 -right-2 text-[9px]">
                    Soon
                </Badge>
            ) : null}
            <Icon className="text-primary size-5" />
            <div>
                <p className="text-xs font-medium">{label}</p>
                <p className="text-muted-foreground text-[10px]">{description}</p>
            </div>
        </div>
    );
}

function PaymentPanel({
    amount,
    qrPayment,
    generating,
    refreshing,
    countdownLabel,
    onBack,
    onRefresh,
}: {
    amount?: number | null;
    qrPayment: QrPayment | null;
    generating: boolean;
    refreshing: boolean;
    countdownLabel: string | null;
    onBack: () => void;
    onRefresh: (label: string) => void;
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Pay with QR Ph</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm">
                    Scan the QR code using your bank or e-wallet app.
                </p>

                <div className="flex flex-col items-center gap-3 py-2">
                    {qrPayment?.qrCodeUrl ? (
                        <img
                            src={qrPayment.qrCodeUrl}
                            alt="QR Ph payment code"
                            className="size-56 rounded-lg border p-2"
                        />
                    ) : (
                        <div className="text-muted-foreground flex size-56 items-center justify-center rounded-lg border text-sm">
                            {generating ? 'Generating QR…' : 'Preparing payment…'}
                        </div>
                    )}
                </div>

                {countdownLabel ? (
                    <p className="text-muted-foreground text-center text-xs">
                        Complete payment within{' '}
                        <span className="text-foreground font-medium">{countdownLabel}</span> or this
                        booking will be automatically cancelled.
                    </p>
                ) : null}

                <div className="bg-amber-500/10 border-amber-500/20 space-y-1 rounded-md border p-3 text-sm">
                    <p className="font-medium text-amber-700 dark:text-amber-400">Payment Instructions:</p>
                    <ol className="text-muted-foreground list-inside list-decimal space-y-0.5">
                        <li>Open your GCash or e-wallet app.</li>
                        <li>Tap on Scan QR.</li>
                        <li>Scan the QR code above.</li>
                        <li>
                            Confirm the payment amount
                            {amount != null ? ` (${formatCurrency(amount)})` : ''}.
                        </li>
                    </ol>
                </div>

                <Button className="w-full" disabled={refreshing} onClick={() => onRefresh("I've Paid")}>
                    <CheckCircle2 className="size-4" />
                    I&apos;ve Paid
                </Button>
                <button
                    type="button"
                    disabled={refreshing}
                    onClick={() => onRefresh('Refresh')}
                    className="text-muted-foreground hover:text-foreground mx-auto block text-xs disabled:opacity-50"
                >
                    {refreshing ? 'Checking…' : 'Refresh payment status'}
                </button>
                <button
                    type="button"
                    onClick={onBack}
                    className="text-muted-foreground hover:text-foreground mx-auto block text-xs"
                >
                    ← Change payment method
                </button>
            </CardContent>
        </Card>
    );
}

function ConfirmationPanel({ booking }: { booking: ResourceBooking }) {
    return (
        <Card className="border-emerald-500/20">
            <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
                <PartyPopper className="size-14 text-emerald-500" />
                <p className="text-lg font-semibold">Payment Successful!</p>
                <p className="text-muted-foreground text-sm">
                    {booking.amount != null ? `${formatCurrency(booking.amount)} paid. ` : ''}
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
                    <div className="flex flex-col items-center gap-1.5">
                        <div
                            className={cn(
                                'flex size-8 items-center justify-center rounded-full text-sm font-semibold',
                                s.number <= step
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-muted text-muted-foreground',
                            )}
                        >
                            {s.number < step ? <CheckCircle2 className="size-4" /> : s.number}
                        </div>
                        <span
                            className={cn(
                                'text-xs whitespace-nowrap',
                                s.number <= step ? 'font-medium' : 'text-muted-foreground',
                            )}
                        >
                            {s.label}
                        </span>
                    </div>
                    {index < steps.length - 1 ? (
                        <div
                            className={cn(
                                'mx-2 h-0.5 flex-1',
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
        <div className="flex items-center justify-between gap-4 border-b py-2 text-sm last:border-0">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium">{children}</span>
        </div>
    );
}

BookingsCheckout.layout = {
    breadcrumbs: [{ title: 'Bookings', href: bookingsIndex() }],
};
