export type RentalItem = {
    id: number;
    name: string;
    sku: string;
    category?: string | null;
    rate: number;
    hourly_rate?: number | null;
    total_quantity: number;
    available_quantity: number;
    status: 'active' | 'inactive';
    description?: string | null;
    revenue?: number;
    created_at?: string;
    updated_at?: string;
};

export type RentalStockMovement = {
    id: number;
    rental_item_id: number;
    user_id?: number | null;
    type: 'restock' | 'check_out' | 'return' | 'adjustment' | 'lost';
    quantity_change: number;
    quantity_after: number;
    reason?: string | null;
    reference_type?: string | null;
    reference_id?: number | null;
    rental_item?: RentalItem;
    user?: { id: number; name: string } | null;
    created_at?: string;
    updated_at?: string;
};

export type RentalTransactionItem = {
    id: number;
    rental_transaction_id: number;
    rental_item_id: number;
    rental_item_name: string;
    quantity: number;
    rate: number;
    quantity_returned: number;
    rental_item?: RentalItem;
    created_at?: string;
    updated_at?: string;
};

export type RentalTransaction = {
    id: number;
    staff_id: number;
    renter_id?: number | null;
    renter_name?: string | null;
    reference_number: string;
    rented_at: string;
    due_at?: string | null;
    duration_type: 'daily' | 'hourly';
    duration_hours?: number | null;
    reserved_for?: string | null;
    returned_at?: string | null;
    total_amount: number;
    status: 'active' | 'returned' | 'overdue' | 'lost' | 'reserved';
    notes?: string | null;
    staff?: { id: number; name: string } | null;
    renter?: { id: number; name: string } | null;
    items?: RentalTransactionItem[];
    created_at?: string;
    updated_at?: string;
};
