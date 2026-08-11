import { Head, Link, router } from '@inertiajs/react';
import {
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
                                    showDeadline={Boolean(paymentDeadline)}
                                    deadlineLabel={deadline.label}
                                    onContinue={() => setStep(2)}
                                />
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
                    </>
                )}
            </div>
        </>
    );
}

function BookingDetailsCard({
    booking,
    showDeadline,
    deadlineLabel,
    onContinue,
}: {
    booking: ResourceBooking;
    showDeadline: boolean;
    deadlineLabel: string | null;
    onContinue: () => void;
}) {
    return (
        <Card className="gap-3 py-4">
            <CardHeader className="px-4">
                <div className="flex items-center gap-2.5">
                    <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
                        <MapPin className="size-4.5" />
                    </div>
                    <div className="min-w-0">
                        <CardTitle className="flex items-center gap-2 text-base">
                            Court Booking #{booking.id}
                            <StatusBadge status={booking.status} />
                        </CardTitle>
                        <p className="text-muted-foreground text-xs">{booking.resource?.name ?? 'Court'}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-3 px-4">
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

                <Card className="bg-muted/40 py-0">
                    <CardContent className="space-y-1.5 p-3 text-sm">
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold">Payment &amp; Refund Policy</p>
                            <Badge variant="outline" className="text-[9px]">
                                Draft
                            </Badge>
                        </div>
                        <ul className="text-muted-foreground list-inside list-disc space-y-0.5 text-[11px]">
                            <li>Confirmed only once payment is received in full.</li>
                            <li>Non-refundable once confirmed, except if the venue cancels or reschedules.</li>
                            <li>Unpaid bookings are auto-cancelled after the time shown.</li>
                        </ul>
                        <label className="flex items-start gap-2 pt-1 text-xs">
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
        <Card className="gap-3 py-4">
            <CardHeader className="px-4">
                <CardTitle className="text-base">Pay with QR Ph</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-4">
                <div className="flex flex-col items-center gap-2">
                    {qrPayment?.qrCodeUrl ? (
                        <img
                            src={qrPayment.qrCodeUrl}
                            alt="QR Ph payment code"
                            className="size-44 rounded-lg border p-2"
                        />
                    ) : (
                        <div className="text-muted-foreground flex size-44 items-center justify-center rounded-lg border text-sm">
                            {generating ? 'Generating QR…' : 'Preparing payment…'}
                        </div>
                    )}
                    {countdownLabel ? (
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

                <div className="flex items-center justify-center gap-2 rounded-md bg-slate-50 py-2.5 text-xs font-medium text-slate-500">
                    <span className="size-1.5 animate-pulse rounded-full bg-slate-400" />
                    Waiting for payment — this page updates automatically once it&apos;s received.
                </div>
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
                        onClick={onBack}
                        className="text-muted-foreground hover:text-foreground text-xs"
                    >
                        ← Change method
                    </button>
                </div>
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
