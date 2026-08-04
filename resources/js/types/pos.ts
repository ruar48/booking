import type { Product } from '@/types/inventory';
import type { Payment } from '@/types/booking';

export type Sale = {
    id: number;
    club_id: number;
    cashier_id: number;
    customer_id?: number | null;
    invoice_number: string;
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    status: 'completed' | 'voided' | 'refunded';
    notes?: string | null;
    items?: SaleItem[];
    payments?: Payment[];
    cashier?: { id: number; name: string; email?: string } | null;
    customer?: { id: number; name: string; email?: string } | null;
    created_at?: string;
    updated_at?: string;
};

export type SaleItem = {
    id: number;
    sale_id: number;
    product_id: number;
    product_name: string;
    quantity: number;
    unit_price: number;
    line_total: number;
    product?: Product;
    created_at?: string;
    updated_at?: string;
};

export type PaymentMethodOption = {
    value: 'cash' | 'card' | 'bank_transfer';
    label: string;
};

export type SalesReport = {
    total_revenue: number;
    total_sales_count: number;
    top_products: {
        product_id: number;
        product_name: string;
        quantity_sold: number;
        revenue: number;
    }[];
    revenue_by_day: {
        date: string;
        revenue: number;
    }[];
};
