export type Product = {
    id: number;
    name: string;
    sku: string;
    category?: string | null;
    price: number;
    cost?: number | null;
    stock_quantity: number;
    low_stock_threshold: number;
    status: 'active' | 'inactive' | 'discontinued';
    photos?: string[] | null;
    description?: string | null;
    stock_movements?: StockMovement[];
    created_at?: string;
    updated_at?: string;
};

export type StockMovement = {
    id: number;
    product_id: number;
    user_id?: number | null;
    type: 'restock' | 'sale' | 'adjustment' | 'return' | 'wastage';
    quantity_change: number;
    quantity_after: number;
    reason?: string | null;
    reference_type?: string | null;
    reference_id?: number | null;
    product?: Product;
    user?: { id: number; name: string } | null;
    created_at?: string;
    updated_at?: string;
};
