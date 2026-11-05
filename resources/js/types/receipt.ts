/** One charged line on an e-receipt (built by App\Services\PaymentReceiptPresenter). */
export type ReceiptItem = {
    label: string;
    starts_at: string | null;
    ends_at: string | null;
    /** Head count for per-player items (Open Play); null for court time. */
    players: number | null;
    amount: number;
};

/**
 * A receipt as the printer prints it: a flat list of lines, top to bottom.
 *
 * Built on the server, so the paper on screen, the saved image and the
 * emailed copy are all drawn from the same list and can't drift apart.
 */
export type ReceiptLine =
    | { kind: 'heading'; text: string }
    | { kind: 'center'; text: string; muted?: boolean; spaced?: boolean }
    | { kind: 'caption'; text: string }
    | { kind: 'reference'; text: string }
    | { kind: 'status'; text: string }
    | {
          kind: 'text';
          text: string;
          muted?: boolean;
          strong?: boolean;
          indent?: boolean;
      }
    | { kind: 'row'; label: string; value: string; strong?: boolean }
    | { kind: 'rule' }
    | { kind: 'note'; text: string }
    | { kind: 'qr'; value: string; caption: string };

/** The e-receipt for a confirmed payment; null on the page until one exists. */
export type Receipt = {
    reference: string;
    venue: { name: string; address: string | null };
    title: string;
    /** "PAID · CONFIRMED", or "PAID · REFUND DUE" for a late or duplicate payment. */
    status: string;
    note: string;
    customer: { name: string | null; phone: string | null };
    items: ReceiptItem[];
    subtotal: number;
    fee: number;
    total: number;
    method: string;
    paid_at: string;
    refund_due: boolean;
    /** Opens the live payment record for staff, so the QR can't be faked. */
    verify_url: string;
    lines: ReceiptLine[];
};
