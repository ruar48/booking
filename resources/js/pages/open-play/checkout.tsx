import { Head, Link, router } from '@inertiajs/react';
import { CalendarDays, CheckCircle2, Clock, MapPin, PartyPopper, QrCode, ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useOpenPlayPaymentChannel } from '@/hooks/use-open-play-payment-channel';
import { formatCurrency, formatDate, formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { browse as openPlayBrowse, join as openPlayJoin } from '@/routes/open-play';
import openPlayCheckout from '@/routes/open-play/checkout';
import type { OpenPlayRegistration, OpenPlaySession } from '@/types/booking';

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
    session: OpenPlaySession;
    registration: OpenPlayRegistration;
    qrPayment?: QrPayment | null;
    policies?: CheckoutPolicy[];
};

type Step = 1 | 2 | 3;

function useExpired(deadline: string | null | undefined) {
    const target = useMemo(() => (deadline ? new Date(deadline).getTime() : null), [deadline]);
    const [expired, setExpired] = useState(() => (target ? target - Date.now() <= 0 : false));

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
            setExpired(false);
            return;
        }

        setExpired(target - Date.now() <= 0);
        const interval = window.setInterval(() => {
            setExpired(target - Date.now() <= 0);
        }, 1000);

        return () => window.clearInterval(interval);
    }, [target]);

    return expired;
}

export default function OpenPlayCheckout({ session, registration, qrPayment = null, policies = [] }: Props) {
    const isPaid = registration.payment_status === 'paid';

    const [step, setStep] = useState<Step>(() => {
        if (isPaid) return 3;
        // A QR record (even an expired one) means the customer already
        // started paying — a refresh should keep them on the payment step
        // with a "generate new QR" prompt, not bounce them back to step 1.
        if (qrPayment) return 2;
        return 1;
    });
    const [agreed, setAgreed] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const qrExpired = useExpired(qrPayment?.expiresAt) && Boolean(qrPayment);

    useOpenPlayPaymentChannel(isPaid ? null : registration.id);

    useEffect(() => {
        if (isPaid) {
            setStep(3);
        }
    }, [isPaid]);

    const generateQr = () => {
        setGenerating(true);
        router.post(
            openPlayCheckout.generate(session).url,
            { payment_method: 'qrph' },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => setStep(2),
                onFinish: () => setGenerating(false),
            },
        );
    };

    const refresh = (label: string) => {
        setRefreshing(true);
        router.reload({
            only: ['registration', 'qrPayment'],
            onSuccess: (page) => {
                const updated = page.props.registration as OpenPlayRegistration;
                if (updated.payment_status !== 'paid') {
                    toast.info(`${label} — payment not received yet.`);
                }
            },
            onFinish: () => setRefreshing(false),
        });
    };

    return (
        <>
            <Head title={`Checkout — ${session.title}`} />
            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="mx-auto flex w-full max-w-lg flex-col gap-3 pb-16">
                    <StepIndicator step={step} />

                    {step === 1 ? (
                        <PaymentMethodCard
                            session={session}
                            registration={registration}
                            policies={policies}
                            agreed={agreed}
                            onAgreedChange={setAgreed}
                            generating={generating}
                            onContinue={generateQr}
                        />
                    ) : step === 2 ? (
                        <PayCard
                            amount={registration.amount}
                            qrPayment={qrPayment}
                            qrExpired={qrExpired}
                            generating={generating}
                            refreshing={refreshing}
                            onRefresh={refresh}
                            onGenerateNew={generateQr}
                        />
                    ) : (
                        <ConfirmationCard session={session} registration={registration} />
                    )}

                    {step !== 3 ? (
                        <Card className="border-emerald-500/20 bg-emerald-500/5 py-0">
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
                </div>
            </div>
        </>
    );
}

OpenPlayCheckout.layout = {
    breadcrumbs: [
        { title: 'Open play', href: openPlayBrowse() },
        { title: 'Checkout', href: openPlayBrowse() },
    ],
};

function PaymentMethodCard({
    session,
    registration,
    policies,
    agreed,
    onAgreedChange,
    generating,
    onContinue,
}: {
    session: OpenPlaySession;
    registration: OpenPlayRegistration;
    policies: { id: number; title: string; body: string }[];
    agreed: boolean;
    onAgreedChange: (value: boolean) => void;
    generating: boolean;
    onContinue: () => void;
}) {
    const requiresAgreement = policies.length > 0;

    return (
        <Card className="gap-3 py-4">
            <CardHeader className="px-4">
                <div className="flex items-center gap-2.5">
                    <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
                        <MapPin className="size-4.5" />
                    </div>
                    <div className="min-w-0">
                        <CardTitle className="truncate text-base">{session.title}</CardTitle>
                        <p className="text-muted-foreground text-xs">Open Play registration</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-3 px-4">
                <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    <span className="flex items-center gap-1">
                        <CalendarDays className="size-3.5" />
                        {formatDate(session.starts_at)}
                    </span>
                    <span className="flex items-center gap-1">
                        <Clock className="size-3.5" />
                        {formatTime(session.starts_at)}
                        {session.ends_at ? ` – ${formatTime(session.ends_at)}` : ''}
                    </span>
                </div>

                <div className="bg-muted flex items-center justify-between rounded-md p-2.5 text-sm">
                    <span className="text-muted-foreground">Amount due</span>
                    <span className="font-semibold">
                        {registration.amount != null ? formatCurrency(registration.amount) : '—'}
                    </span>
                </div>

                <div>
                    <p className="mb-1.5 text-xs font-semibold">Payment Method</p>
                    <div className="border-primary ring-primary/20 relative flex flex-col items-center gap-1 rounded-lg border p-2 text-center ring-2 sm:w-32">
                        <QrCode className="text-primary size-4.5" />
                        <div>
                            <p className="text-[11px] font-medium">QR Ph</p>
                            <p className="text-muted-foreground hidden text-[10px] sm:block">Any bank or e-wallet</p>
                        </div>
                    </div>
                </div>

                {policies.map((policy) => (
                    <PolicyCard key={policy.id} title={policy.title} body={policy.body} />
                ))}

                {requiresAgreement ? (
                    <label className="flex items-start gap-2 px-1 text-xs">
                        <Checkbox
                            checked={agreed}
                            onCheckedChange={(checked) => onAgreedChange(checked === true)}
                        />
                        <span>I have read and agree to the policies above.</span>
                    </label>
                ) : null}

                <Button
                    className="w-full"
                    onClick={onContinue}
                    disabled={(requiresAgreement && !agreed) || generating}
                >
                    {generating ? 'Generating QR…' : 'Continue to Payment'}
                </Button>
            </CardContent>
        </Card>
    );
}

function PolicyCard({ title, body }: { title: string; body: string }) {
    const lines = body.split('\n').map((line) => line.trim()).filter(Boolean);

    return (
        <Card className="bg-muted/40 py-0">
            <CardContent className="space-y-1.5 p-3 text-sm">
                <p className="text-xs font-semibold">{title}</p>
                <ul className="text-muted-foreground list-inside list-disc space-y-0.5 text-[11px]">
                    {lines.map((line, index) => (
                        <li key={index}>{line}</li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
}

function PayCard({
    amount,
    qrPayment,
    qrExpired,
    generating,
    refreshing,
    onRefresh,
    onGenerateNew,
}: {
    amount?: number | string | null;
    qrPayment: QrPayment | null;
    qrExpired: boolean;
    generating: boolean;
    refreshing: boolean;
    onRefresh: (label: string) => void;
    onGenerateNew: () => void;
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
                        <div className="text-muted-foreground flex size-44 flex-col items-center justify-center gap-2 rounded-lg border text-center text-sm">
                            <span>QR code expired</span>
                            <Button size="sm" onClick={onGenerateNew} disabled={generating}>
                                Generate new QR
                            </Button>
                        </div>
                    ) : qrPayment?.qrCodeUrl ? (
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
                        Waiting for payment — this page updates automatically once it's received.
                    </div>
                ) : null}
                <button
                    type="button"
                    disabled={refreshing}
                    onClick={() => onRefresh('Refresh')}
                    className="text-muted-foreground hover:text-foreground mx-auto block text-xs disabled:opacity-50"
                >
                    {refreshing ? 'Checking…' : 'Refresh payment status'}
                </button>
            </CardContent>
        </Card>
    );
}

function ConfirmationCard({ session, registration }: { session: OpenPlaySession; registration: OpenPlayRegistration }) {
    return (
        <Card className="border-emerald-500/20">
            <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
                <PartyPopper className="size-14 text-emerald-500" />
                <p className="text-lg font-semibold">Payment Successful!</p>
                <p className="text-muted-foreground text-sm">
                    {registration.amount != null ? `${formatCurrency(registration.amount)} paid. ` : ''}
                    You&apos;re registered for {session.title} — see you on the court.
                </p>
                <Button asChild className="mt-2">
                    <Link href={openPlayJoin(session)}>View session</Link>
                </Button>
            </CardContent>
        </Card>
    );
}

function StepIndicator({ step }: { step: Step }) {
    const steps = [
        { number: 1, label: 'Payment Method' },
        { number: 2, label: 'Pay' },
        { number: 3, label: 'Confirmation' },
    ];

    return (
        <div className="mx-auto flex w-full items-center">
            {steps.map((s, index) => (
                <div key={s.number} className="flex flex-1 items-center last:flex-none">
                    <div className="flex flex-col items-center gap-1">
                        <div
                            className={cn(
                                'flex size-6 items-center justify-center rounded-full text-xs font-semibold',
                                s.number <= step ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground',
                            )}
                        >
                            {s.number < step ? <CheckCircle2 className="size-3.5" /> : s.number}
                        </div>
                        <span
                            className={cn(
                                'text-[10px] whitespace-nowrap',
                                s.number <= step ? 'font-medium' : 'text-muted-foreground',
                            )}
                        >
                            {s.label}
                        </span>
                    </div>
                    {index < steps.length - 1 ? (
                        <div
                            className={cn('mx-1.5 h-0.5 flex-1', s.number < step ? 'bg-emerald-500' : 'bg-muted')}
                        />
                    ) : null}
                </div>
            ))}
        </div>
    );
}
