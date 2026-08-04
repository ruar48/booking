import QRCode from 'qrcode';
import { useEffect, useState } from 'react';

type QrCodeProps = {
    value: string;
    size?: number;
    className?: string;
};

export function QrCode({ value, size = 160, className }: QrCodeProps) {
    const [svg, setSvg] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        QRCode.toString(value, { type: 'svg', margin: 1, width: size })
            .then((result) => {
                if (!cancelled) {
                    setSvg(result);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setSvg(null);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [value, size]);

    return (
        <div
            className={className}
            style={{ width: size, height: size }}
            // Content is our own generated QR SVG markup, not user input.
            dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
        />
    );
}
