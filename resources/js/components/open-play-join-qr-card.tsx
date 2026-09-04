import { Check, Copy, Download, QrCode as QrCodeIcon } from 'lucide-react';
import QRCode from 'qrcode';
import { useEffect, useMemo, useState } from 'react';

import { QrCode } from '@/components/qr-code';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { join as joinShow } from '@/routes/open-play';
import type { OpenPlaySession } from '@/types/booking';

export function OpenPlayJoinQrCard({ session }: { session: OpenPlaySession }) {
    const [copied, setCopied] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

    const joinUrl = useMemo(() => {
        const path = joinShow(session).url;

        return typeof window === 'undefined'
            ? path
            : `${window.location.origin}${path}`;
    }, [session]);

    useEffect(() => {
        let cancelled = false;

        // A separate, higher-resolution PNG render just for downloading —
        // the on-screen QrCode component stays a crisp, scalable SVG.
        QRCode.toDataURL(joinUrl, { width: 1024, margin: 2 })
            .then((url) => {
                if (!cancelled) {
                    setDownloadUrl(url);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setDownloadUrl(null);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [joinUrl]);

    const copyLink = () => {
        navigator.clipboard.writeText(joinUrl).then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-start gap-3 px-5 pt-5 pb-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                    <QrCodeIcon className="size-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                    <CardTitle className="text-base leading-tight">
                        Registration QR code
                    </CardTitle>
                    <CardDescription className="mt-0.5">
                        Print or display this at the venue — scanning it lets
                        players register themselves for this session.
                    </CardDescription>
                </div>
            </CardHeader>
            {/* Centred rather than left-aligned: the card is used in narrow
                side columns, where a floated QR left a wide empty gutter. */}
            <CardContent className="flex flex-col items-center gap-4">
                <QrCode
                    value={joinUrl}
                    size={180}
                    className="shrink-0 rounded-xl border bg-card p-3 shadow-sm"
                />

                <div className="flex w-full min-w-0 flex-col gap-2">
                    <div className="rounded-md border bg-muted px-3 py-2 text-center text-xs break-all text-muted-foreground">
                        {joinUrl}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={copyLink}
                        >
                            {copied ? (
                                <Check className="size-4 text-emerald-600" />
                            ) : (
                                <Copy className="size-4" />
                            )}
                            {copied ? 'Copied' : 'Copy link'}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            asChild
                            disabled={!downloadUrl}
                        >
                            <a
                                href={downloadUrl ?? undefined}
                                download={`open-play-${session.id}-qr-code.png`}
                            >
                                <Download className="size-4" />
                                Download
                            </a>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
