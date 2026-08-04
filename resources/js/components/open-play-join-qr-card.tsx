import { Check, Copy, Download } from 'lucide-react';
import QRCode from 'qrcode';
import { useEffect, useMemo, useState } from 'react';

import { QrCode } from '@/components/qr-code';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { join as joinShow } from '@/routes/open-play';
import type { ClubEvent } from '@/types/booking';

export function OpenPlayJoinQrCard({ session }: { session: ClubEvent }) {
    const [copied, setCopied] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

    const joinUrl = useMemo(() => {
        const path = joinShow(session).url;

        return typeof window === 'undefined' ? path : `${window.location.origin}${path}`;
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
            <CardHeader>
                <CardTitle>Registration QR code</CardTitle>
                <CardDescription>
                    Print or display this at the venue — scanning it lets players register themselves
                    for this session.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                <QrCode
                    value={joinUrl}
                    size={160}
                    className="shrink-0 rounded-lg border border-slate-200 p-2"
                />
                <div className="flex w-full min-w-0 flex-col gap-2">
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs break-all text-slate-600">
                        {joinUrl}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-fit"
                            onClick={copyLink}
                        >
                            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                            {copied ? 'Copied' : 'Copy link'}
                        </Button>
                        <Button type="button" variant="outline" size="sm" className="w-fit" asChild disabled={!downloadUrl}>
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
