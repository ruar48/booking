import { CheckCircle2, Download } from 'lucide-react';
import QRCode from 'qrcode';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { brand } from '@/lib/brand';
import { formatCurrency } from '@/lib/format';
import { receiptLines } from '@/lib/receipt';
import type { ReceiptLine } from '@/lib/receipt';
import { saveReceiptImage } from '@/lib/receipt-image';
import { cn } from '@/lib/utils';
import type { Receipt } from '@/types/receipt';

/**
 * printing → paper feeds out of the slot
 * tearing  → cut at the slot, the receipt drops clear and swings to rest
 * done     → resting where the tear left it
 * still    → reduced motion: shown fully printed, nothing moves
 */
type Phase = 'printing' | 'tearing' | 'done' | 'still';

// The feed advances a line at a time with a beat between lines, like a
// thermal printer's stepper motor, instead of gliding out in one motion.
const LINE_PX = 22;
const STEP_MS = 70;
const MIN_FEED_MS = 2200;
const MAX_FEED_MS = 5000;
const WARM_UP_MS = 550;

/**
 * A payment receipt that prints out of a little thermal printer when it
 * appears, with a button to save it as an image. Tapping it while it prints
 * skips to the end.
 */
export function ThermalReceipt({ receipt, children }: { receipt: Receipt; children?: React.ReactNode }) {
    const lines = useMemo(() => receiptLines(receipt), [receipt]);
    const paperRef = useRef<HTMLDivElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);
    const animationsRef = useRef<Animation[]>([]);
    const [phase, setPhase] = useState<Phase>('printing');
    const [saving, setSaving] = useState(false);

    // A layout effect so the paper is tucked into the printer before the first
    // paint. Motion preferences are only read here, on the client: the server
    // render always starts at "printing", so hydration never mismatches.
    useLayoutEffect(() => {
        const paper = paperRef.current;
        const progress = progressRef.current;

        if (!paper || !progress) {
            return;
        }

        const height = paper.offsetHeight;
        const steps = Math.max(8, Math.round(height / LINE_PX));
        const timing: KeyframeAnimationOptions = {
            duration: Math.min(MAX_FEED_MS, Math.max(MIN_FEED_MS, steps * STEP_MS)),
            delay: WARM_UP_MS,
            fill: 'both',
        };

        const feed = paper.animate(feedKeyframes(height, steps), timing);
        const bar = progress.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], timing);
        animationsRef.current = [feed, bar];

        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let active = true;

        feed.finished
            .then(() => {
                if (active) {
                    setPhase(reducedMotion ? 'still' : 'tearing');
                }
            })
            .catch(() => {
                // Cancelled because the receipt unmounted mid-print.
            });

        if (reducedMotion) {
            feed.finish();
            bar.finish();
        }

        return () => {
            active = false;
            feed.cancel();
            bar.cancel();
        };
    }, []);

    const printing = phase === 'printing';
    const torn = phase === 'tearing' || phase === 'done';
    const ready = phase === 'done' || phase === 'still';

    const skipToEnd = () => {
        if (printing) {
            animationsRef.current.forEach((animation) => animation.finish());
        }
    };

    const save = async () => {
        setSaving(true);

        try {
            await saveReceiptImage(lines, `receipt-${receipt.reference}.png`);
        } catch (error) {
            console.error('receipt.save.failed', error);
            toast.error("Couldn't save the receipt. Take a screenshot of it instead.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="mx-auto flex w-full max-w-[24rem] flex-col gap-4">
            <p className="sr-only" role="status">
                {ready ? 'Payment complete. Your e-receipt is ready.' : 'Payment complete. Printing your e-receipt.'}
            </p>

            <div
                className={cn('relative', printing && 'cursor-pointer')}
                onClick={skipToEnd}
                title={printing ? 'Tap to finish printing' : undefined}
            >
                <Printer receipt={receipt} printing={printing} cutting={phase === 'tearing'} progressRef={progressRef} />

                {/* Hides the paper that is still inside the printer. Clipped
                    along the top edge only (the negative insets), so the
                    shadow and the swing after the tear are never cut off. */}
                <div className="relative px-5 pb-3 [clip-path:inset(0_-3rem_-3rem_-3rem)] sm:px-7">
                    <div
                        className={cn(torn && 'animate-receipt-tear')}
                        onAnimationEnd={(event) => {
                            if (event.target === event.currentTarget) {
                                setPhase('done');
                            }
                        }}
                    >
                        <div
                            ref={paperRef}
                            className={cn(printing && 'will-change-transform')}
                            style={{
                                // Hidden in the printer from the very first paint
                                // (server render included); the feed takes over.
                                transform: printing ? 'translateY(-100%)' : undefined,
                                // On this wrapper, not the paper: the paper's
                                // mask would cut its own shadow off.
                                filter: 'drop-shadow(0 6px 12px rgb(40 32 20 / 0.16))',
                            }}
                        >
                            <ReceiptPaper lines={lines} />
                        </div>
                    </div>
                </div>
            </div>

            <div
                className={cn(
                    'grid grid-cols-2 gap-2 motion-safe:transition motion-safe:duration-500',
                    ready ? 'opacity-100' : 'pointer-events-none translate-y-2 opacity-0',
                )}
                inert={!ready}
            >
                <Button onClick={save} disabled={saving}>
                    <Download />
                    {saving ? 'Saving…' : 'Save receipt'}
                </Button>
                {children}
            </div>
        </div>
    );
}

/**
 * Hold, then advance one line, for every line of paper — the stop-start
 * rhythm of a stepper motor. Ends with the top of the paper at the slot.
 */
function feedKeyframes(height: number, steps: number): Keyframe[] {
    const stepPx = height / steps;
    const frames: Keyframe[] = [];

    for (let step = 0; step < steps; step++) {
        const offset = step / steps;
        const from = -height + step * stepPx;

        frames.push(
            { offset, transform: `translateY(${from}px)`, easing: 'cubic-bezier(0.25, 0.7, 0.4, 1)' },
            { offset: offset + 0.55 / steps, transform: `translateY(${from + stepPx}px)` },
        );
    }

    frames.push({ offset: 1, transform: 'translateY(0px)' });

    return frames;
}

function Printer({
    receipt,
    printing,
    cutting,
    progressRef,
}: {
    receipt: Receipt;
    printing: boolean;
    cutting: boolean;
    progressRef: React.RefObject<HTMLDivElement | null>;
}) {
    return (
        <div
            aria-hidden
            className={cn(
                'relative z-10 rounded-[1.35rem] bg-linear-to-b from-[#2e2b27] to-[#171513] px-3.5 pt-3.5 pb-6 ring-1 ring-black/50 dark:ring-white/10',
                'shadow-[0_16px_30px_-14px_rgb(0_0_0/0.6),inset_0_1px_0_rgb(255_255_255/0.08)]',
                printing && 'animate-printer-buzz',
            )}
        >
            <div className="mb-3 flex items-center justify-between">
                <span className="flex size-7 items-center justify-center overflow-hidden rounded-md bg-white shadow-sm">
                    <img src={brand.logo} alt="" className="size-6 object-contain" />
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_1px_rgb(52_211_153/0.7)]" />
                    <span
                        className={cn(
                            'size-1.5 rounded-full',
                            printing
                                ? 'animate-printer-led bg-amber-400 shadow-[0_0_6px_1px_rgb(251_191_36/0.7)]'
                                : 'bg-emerald-400 shadow-[0_0_6px_1px_rgb(52_211_153/0.7)]',
                        )}
                    />
                </span>
            </div>

            <div className="relative overflow-hidden rounded-xl bg-[#0e0d0b] px-3.5 pt-2.5 pb-3 shadow-[inset_0_2px_6px_rgb(0_0_0/0.7)] ring-1 ring-white/5">
                <div className="flex items-center justify-between gap-2">
                    <p className="flex items-center gap-1.5 text-[13px] font-medium text-[#efeadf]">
                        <CheckCircle2 className="size-4 text-emerald-400" />
                        Payment complete
                    </p>
                    <span
                        className={cn(
                            'font-mono text-[9px] font-semibold tracking-[0.2em]',
                            printing ? 'text-amber-300' : 'text-emerald-400',
                        )}
                    >
                        {printing ? 'PRINTING' : 'READY'}
                    </span>
                </div>
                <div className="mt-1.5 flex items-baseline justify-between gap-3 font-mono">
                    <span className="truncate text-[11px] text-[#a19b8f]">{receipt.reference}</span>
                    <span className="shrink-0 text-sm font-semibold text-[#efeadf]">
                        {formatCurrency(receipt.total)}
                    </span>
                </div>
                <div
                    className={cn(
                        'absolute inset-x-0 bottom-0 h-0.5 bg-white/5 transition-opacity duration-500',
                        !printing && 'opacity-0',
                    )}
                >
                    <div ref={progressRef} className="h-full origin-left bg-emerald-400/80" style={{ transform: 'scaleX(0)' }} />
                </div>
            </div>

            {/* The paper slot, straddling the printer's bottom edge so it
                overlaps the top of the paper: the receipt reads as coming out
                of it rather than from behind the printer. */}
            <div className="absolute inset-x-4 -bottom-0.75 h-1.5 rounded-full bg-[#050505] shadow-[0_2px_4px_rgb(0_0_0/0.35)] ring-1 ring-black">
                {cutting ? (
                    <span className="animate-receipt-cut absolute inset-x-2 top-1/2 h-px -translate-y-1/2 bg-white/90" />
                ) : null}
            </div>
        </div>
    );
}

function ReceiptPaper({ lines }: { lines: ReceiptLine[] }) {
    return (
        <section
            aria-label="E-receipt"
            className="receipt-torn-edges flex flex-col gap-1 bg-[#fbf9f4] bg-[linear-gradient(to_bottom,#f1ece1,#fbf9f4_2.5rem)] px-5 pt-8 pb-9 font-mono text-[12px] leading-normal text-[#24221e]"
        >
            {lines.map((line, index) => (
                <PaperLine key={index} line={line} />
            ))}
        </section>
    );
}

function PaperLine({ line }: { line: ReceiptLine }) {
    switch (line.kind) {
        case 'heading':
            return <p className="text-center text-[15px] leading-snug font-bold tracking-[0.16em] text-balance">{line.text}</p>;
        case 'center':
            return (
                <p
                    className={cn(
                        'text-center',
                        line.spaced ? 'text-[10px] tracking-[0.24em]' : 'text-[11px]',
                        line.muted && 'text-[#736d63]',
                    )}
                >
                    {line.text}
                </p>
            );
        case 'caption':
            return <p className="text-[10px] tracking-[0.2em] text-[#736d63]">{line.text}</p>;
        case 'reference':
            return <p className="text-xl leading-tight font-bold tracking-wide break-all">{line.text}</p>;
        case 'status':
            return (
                <p className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.16em]">
                    <span className="size-1.75 shrink-0 rounded-full bg-[#0f9f6e]" />
                    {line.text}
                </p>
            );
        case 'text':
            return (
                <p className={cn(line.strong && 'font-semibold', line.muted && 'text-[#736d63]', line.indent && 'pl-2.5')}>
                    {line.text}
                </p>
            );
        case 'row':
            return (
                <div className={cn('flex items-baseline gap-1.5', line.strong && 'font-bold')}>
                    <span className="min-w-0 wrap-break-word">{line.label}</span>
                    <span aria-hidden className="min-w-3 flex-1 border-b border-dotted border-[#b9b09d]" />
                    <span className="max-w-[60%] shrink-0 text-right wrap-break-word">{line.value}</span>
                </div>
            );
        case 'rule':
            return <hr className="my-2 border-0 border-t border-dashed border-[#c4bba9]" />;
        case 'note':
            return <p className="my-1 border border-[#24221e] p-2.5 text-[11.5px] leading-relaxed">{line.text}</p>;
        case 'qr':
            return <ReceiptQr value={line.value} caption={line.caption} />;
    }
}

/**
 * Drawn as one SVG path straight from the QR matrix: synchronous, so the
 * paper's height is final before the feed measures it, and transparent, so it
 * sits on the paper colour instead of a white box.
 */
function ReceiptQr({ value, caption }: { value: string; caption: string }) {
    const { path, size } = useMemo(() => {
        const { modules } = QRCode.create(value, { errorCorrectionLevel: 'M' });
        let d = '';

        for (let row = 0; row < modules.size; row++) {
            for (let col = 0; col < modules.size; col++) {
                if (modules.data[row * modules.size + col]) {
                    d += `M${col} ${row}h1v1h-1z`;
                }
            }
        }

        return { path: d, size: modules.size };
    }, [value]);

    return (
        <div className="flex flex-col items-center gap-1 pt-1">
            {/* Two modules of quiet zone built in; scanners need the margin. */}
            <svg
                viewBox={`-2 -2 ${size + 4} ${size + 4}`}
                className="size-30"
                shapeRendering="crispEdges"
                role="img"
                aria-label="Receipt verification QR code"
            >
                <path d={path} fill="currentColor" />
            </svg>
            <p className="text-[10px] tracking-[0.2em] text-[#736d63]">{caption}</p>
        </div>
    );
}
