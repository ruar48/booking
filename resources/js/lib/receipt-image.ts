import QRCode from 'qrcode';

import type { ReceiptLine } from '@/types/receipt';

/*
 * Draws a receipt onto a canvas for "Save receipt".
 *
 * Done by hand rather than screenshotting the DOM: the receipt is just lines
 * of monospace text, so a small canvas renderer is simpler and more reliable
 * than a DOM-to-image dependency (fonts, CORS, and CSS masks all trip those
 * up), and the result looks the same on every phone.
 */

// A 58 mm thermal roll prints 384 dots across; the image keeps that width.
const PAPER_WIDTH = 384;
const PAD_X = 24;
const TOOTH = 6;
const TOOTH_WIDTH = 12;
const PAD_TOP = 26 + TOOTH;
const PAD_BOTTOM = 26 + TOOTH;
const MARGIN = 28;
const CONTENT_WIDTH = PAPER_WIDTH - PAD_X * 2;
const LEADER_GAP = 6;
// Big canvases fail silently on iOS (blank image) past ~16.7M pixels.
const MAX_PIXELS = 16_000_000;

const FONT_FAMILY = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';

const COLOR = {
    backdrop: '#e9e5dc',
    paper: '#fbf9f4',
    ink: '#24221e',
    muted: '#736d63',
    faint: '#c4bba9',
    paid: '#0f9f6e',
} as const;

type TextStyle = {
    size: number;
    lineHeight: number;
    weight?: 400 | 600 | 700;
    color?: string;
    spacing?: number;
};

const STYLE = {
    heading: { size: 16, lineHeight: 22, weight: 700, spacing: 2.4 },
    center: { size: 11, lineHeight: 16, color: COLOR.muted },
    spaced: { size: 10, lineHeight: 16, spacing: 2.6 },
    caption: { size: 10, lineHeight: 15, color: COLOR.muted, spacing: 2 },
    reference: { size: 21, lineHeight: 28, weight: 700, spacing: 0.5 },
    status: { size: 10, lineHeight: 16, weight: 600, spacing: 1.6 },
    text: { size: 12, lineHeight: 18 },
    row: { size: 12, lineHeight: 19 },
    note: { size: 11.5, lineHeight: 17 },
} satisfies Record<string, TextStyle>;

export async function saveReceiptImage(lines: ReceiptLine[], filename: string): Promise<void> {
    const canvas = renderReceipt(lines);
    // toDataURL, not toBlob: it is synchronous, so the share sheet below still
    // runs inside the tap that asked for it (Safari refuses otherwise).
    const blob = dataUrlToBlob(canvas.toDataURL('image/png'));
    const file = new File([blob], filename, { type: 'image/png' });

    // On a phone the share sheet is how an image reaches Photos or a chat;
    // everywhere else a plain download is what people expect.
    const isPhone = window.matchMedia('(pointer: coarse)').matches;

    if (isPhone && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({ files: [file], title: filename });

            return;
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
                return;
            }
            // Sharing is unavailable after all — fall through to a download.
        }
    }

    download(blob, filename);
}

export function renderReceipt(lines: ReceiptLine[]): HTMLCanvasElement {
    const measuring = document.createElement('canvas').getContext('2d');

    if (!measuring) {
        throw new Error('Canvas 2D is not available.');
    }

    const paperHeight = PAD_TOP + layout(measuring, lines, false) + PAD_BOTTOM;
    const width = PAPER_WIDTH + MARGIN * 2;
    const height = paperHeight + MARGIN * 2;
    // Whole-number scales keep QR modules and dotted rules on exact pixels.
    const preferred = Math.min(3, Math.max(2, Math.round(window.devicePixelRatio || 1)));
    const scale = Math.min(preferred, Math.floor(Math.sqrt(MAX_PIXELS / (width * height))) || 1);

    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;

    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('Canvas 2D is not available.');
    }

    ctx.scale(scale, scale);
    ctx.fillStyle = COLOR.backdrop;
    ctx.fillRect(0, 0, width, height);

    // Shadow sizes are in device pixels — the transform doesn't scale them.
    ctx.save();
    ctx.shadowColor = 'rgba(40, 32, 20, 0.18)';
    ctx.shadowBlur = 16 * scale;
    ctx.shadowOffsetY = 6 * scale;
    ctx.fillStyle = COLOR.paper;
    tracePaper(ctx, MARGIN, MARGIN, PAPER_WIDTH, paperHeight);
    ctx.fill();
    ctx.restore();

    ctx.translate(MARGIN + PAD_X, MARGIN + PAD_TOP);
    layout(ctx, lines, true);

    return canvas;
}

/**
 * Walks the lines top to bottom, drawing them when `draw` is set, and returns
 * the height they take — run once to size the canvas, once to paint it.
 */
function layout(ctx: CanvasRenderingContext2D, lines: ReceiptLine[], draw: boolean): number {
    let y = 0;
    ctx.textBaseline = 'middle';

    const paragraph = (text: string, style: TextStyle, align: 'left' | 'center', indent = 0): void => {
        setFont(ctx, style);

        for (const row of wrap(ctx, text, CONTENT_WIDTH - indent, style.spacing)) {
            if (draw) {
                const x = align === 'center' ? (CONTENT_WIDTH - measure(ctx, row, style.spacing)) / 2 : indent;
                fillText(ctx, row, x, y + style.lineHeight / 2, style);
            }

            y += style.lineHeight;
        }
    };

    for (const line of lines) {
        switch (line.kind) {
            case 'heading':
                paragraph(line.text, STYLE.heading, 'center');
                y += 2;
                break;
            case 'center':
                paragraph(line.text, line.spaced ? STYLE.spaced : { ...STYLE.center, color: line.muted ? COLOR.muted : COLOR.ink }, 'center');
                break;
            case 'caption':
                paragraph(line.text, STYLE.caption, 'left');
                break;
            case 'reference':
                paragraph(line.text, STYLE.reference, 'left');
                break;
            case 'status':
                if (draw) {
                    ctx.fillStyle = COLOR.paid;
                    ctx.beginPath();
                    ctx.arc(3.5, y + STYLE.status.lineHeight / 2, 3.5, 0, Math.PI * 2);
                    ctx.fill();
                }

                paragraph(line.text, STYLE.status, 'left', 13);
                y += 2;
                break;
            case 'text':
                paragraph(
                    line.text,
                    { ...STYLE.text, weight: line.strong ? 600 : 400, color: line.muted ? COLOR.muted : COLOR.ink },
                    'left',
                    line.indent ? 10 : 0,
                );
                break;
            case 'row':
                y += row(ctx, line.label, line.value, line.strong ?? false, y, draw);
                break;
            case 'rule':
                y += 10;

                if (draw) {
                    ctx.fillStyle = COLOR.faint;

                    for (let x = 0; x < CONTENT_WIDTH; x += 7) {
                        ctx.fillRect(x, y, Math.min(4, CONTENT_WIDTH - x), 1);
                    }
                }

                y += 11;
                break;
            case 'note':
                y += 4 + note(ctx, line.text, y + 4, draw) + 4;
                break;
            case 'qr':
                y += 6 + qr(ctx, line.value, line.caption, y + 6, draw) + 4;
                break;
        }
    }

    return y;
}

/** "Label ........ value", wrapping either side when it can't fit one line. */
function row(ctx: CanvasRenderingContext2D, label: string, value: string, strong: boolean, y: number, draw: boolean): number {
    const style: TextStyle = { ...STYLE.row, weight: strong ? 700 : 400 };
    setFont(ctx, style);

    const valueRows = wrap(ctx, value, CONTENT_WIDTH * 0.6);
    const valueWidth = Math.max(...valueRows.map((text) => measure(ctx, text)));
    const labelRows = wrap(ctx, label, CONTENT_WIDTH - valueWidth - LEADER_GAP * 2 - 12);

    if (draw) {
        labelRows.forEach((text, index) => fillText(ctx, text, 0, y + style.lineHeight * (index + 0.5), style));
        valueRows.forEach((text, index) =>
            fillText(ctx, text, CONTENT_WIDTH - measure(ctx, text), y + style.lineHeight * (index + 0.5), style),
        );

        const from = measure(ctx, labelRows[0]) + LEADER_GAP;
        const to = CONTENT_WIDTH - measure(ctx, valueRows[0]) - LEADER_GAP;
        ctx.fillStyle = COLOR.faint;

        for (let x = from; x < to; x += 3) {
            ctx.fillRect(Math.round(x), Math.round(y + style.lineHeight * 0.7), 1, 1);
        }
    }

    return Math.max(labelRows.length, valueRows.length) * style.lineHeight;
}

function note(ctx: CanvasRenderingContext2D, text: string, y: number, draw: boolean): number {
    const padding = 10;
    const style: TextStyle = { ...STYLE.note, color: COLOR.ink };
    setFont(ctx, style);

    const rows = wrap(ctx, text, CONTENT_WIDTH - padding * 2);
    const height = rows.length * style.lineHeight + padding * 2;

    if (draw) {
        ctx.strokeStyle = COLOR.ink;
        ctx.lineWidth = 1;
        ctx.strokeRect(0.5, y + 0.5, CONTENT_WIDTH - 1, height - 1);
        rows.forEach((row, index) => fillText(ctx, row, padding, y + padding + style.lineHeight * (index + 0.5), style));
    }

    return height;
}

function qr(ctx: CanvasRenderingContext2D, value: string, caption: string, y: number, draw: boolean): number {
    const { modules } = QRCode.create(value, { errorCorrectionLevel: 'M' });
    // Whole-pixel modules: fractional ones leave hairline seams scanners hate.
    const cell = Math.max(2, Math.floor(132 / modules.size));
    const size = cell * modules.size;
    const captionHeight = STYLE.caption.lineHeight;

    if (draw) {
        const left = Math.round((CONTENT_WIDTH - size) / 2);
        ctx.fillStyle = COLOR.ink;

        for (let r = 0; r < modules.size; r++) {
            for (let c = 0; c < modules.size; c++) {
                if (modules.data[r * modules.size + c]) {
                    ctx.fillRect(left + c * cell, y + r * cell, cell, cell);
                }
            }
        }

        setFont(ctx, STYLE.caption);
        fillText(ctx, caption, (CONTENT_WIDTH - measure(ctx, caption, STYLE.caption.spacing)) / 2, y + size + 6 + captionHeight / 2, STYLE.caption);
    }

    return size + 6 + captionHeight;
}

/** The paper outline, torn into a zigzag top and bottom. */
function tracePaper(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): void {
    const teeth = Math.round(width / TOOTH_WIDTH);
    const tooth = width / teeth;

    ctx.beginPath();
    ctx.moveTo(x, y + TOOTH);

    for (let i = 0; i < teeth; i++) {
        ctx.lineTo(x + i * tooth + tooth / 2, y);
        ctx.lineTo(x + (i + 1) * tooth, y + TOOTH);
    }

    ctx.lineTo(x + width, y + height - TOOTH);

    for (let i = teeth; i > 0; i--) {
        ctx.lineTo(x + i * tooth - tooth / 2, y + height);
        ctx.lineTo(x + (i - 1) * tooth, y + height - TOOTH);
    }

    ctx.closePath();
}

function setFont(ctx: CanvasRenderingContext2D, style: TextStyle): void {
    ctx.font = `${style.weight ?? 400} ${style.size}px ${FONT_FAMILY}`;
}

/** Text width including letter spacing (drawn by hand: canvas letterSpacing isn't in every Safari). */
function measure(ctx: CanvasRenderingContext2D, text: string, spacing = 0): number {
    const characters = Array.from(text);

    return ctx.measureText(text).width + spacing * Math.max(0, characters.length - 1);
}

function fillText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, style: TextStyle): void {
    ctx.fillStyle = style.color ?? COLOR.ink;

    if (!style.spacing) {
        ctx.fillText(text, x, y);

        return;
    }

    let cursor = x;

    for (const character of Array.from(text)) {
        ctx.fillText(character, cursor, y);
        cursor += ctx.measureText(character).width + style.spacing;
    }
}

/** Greedy word wrap; a single word wider than the line breaks mid-word. */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, spacing = 0): string[] {
    const rows: string[] = [];
    let current = '';

    for (const word of text.split(' ')) {
        const candidate = current ? `${current} ${word}` : word;

        if (measure(ctx, candidate, spacing) <= maxWidth) {
            current = candidate;
            continue;
        }

        if (current) {
            rows.push(current);
        }

        current = '';

        for (const character of Array.from(word)) {
            if (current && measure(ctx, current + character, spacing) > maxWidth) {
                rows.push(current);
                current = character;
            } else {
                current += character;
            }
        }
    }

    rows.push(current);

    return rows;
}

function dataUrlToBlob(dataUrl: string): Blob {
    const [header, base64] = dataUrl.split(',');
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    return new Blob([bytes], { type: header.match(/data:(.*?);/)?.[1] ?? 'image/png' });
}

function download(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    // Some browsers read the blob after click() returns.
    window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
