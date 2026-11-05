/** One charged line on an e-receipt (built by App\Services\PaymentReceiptPresenter). */
export type ReceiptItem = {
    label: string;
    starts_at: string | null;
    ends_at: string | null;
    /** Head count for per-player items (Open Play); null for court time. */
    players: number | null;
    amount: number;
};

/** The e-receipt for a confirmed payment; null on the page until one exists. */
export type Receipt = {
    reference: string;
    venue: { name: string; address: string | null };
    title: string;
    note: string;
    customer: { name: string | null; phone: string | null };
    items: ReceiptItem[];
    subtotal: number;
    fee: number;
    total: number;
    method: string;
    paid_at: string;
    /** Opens the live payment record for staff, so the QR can't be faked. */
    verify_url: string;
};
