import { Head, Link, router } from '@inertiajs/react';
import { type ColumnDef } from '@tanstack/react-table';
import { Package, Pencil, Plus } from 'lucide-react';
import { useCallback } from 'react';

import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { create, edit, index as productsIndex } from '@/routes/products';
import type { Paginated } from '@/types/booking';
import type { Product } from '@/types/inventory';

type Props = {
    products: Paginated<Product>;
    filters: {
        search?: string;
        low_stock?: boolean;
    };
};

export default function InventoryIndex({ products, filters }: Props) {
    const handleSearch = useCallback(
        (value: string) => {
            router.get(
                productsIndex().url,
                { ...filters, search: value || undefined },
                { preserveState: true, replace: true },
            );
        },
        [filters],
    );

    const toggleLowStock = (checked: boolean) => {
        router.get(
            productsIndex().url,
            { ...filters, low_stock: checked ? 1 : undefined },
            { preserveState: true, replace: true },
        );
    };

    const columns: ColumnDef<Product>[] = [
        {
            accessorKey: 'sku',
            header: 'SKU',
            cell: ({ row }) => (
                <Link href={edit(row.original)} className="font-medium hover:underline">
                    {row.original.sku}
                </Link>
            ),
        },
        {
            accessorKey: 'name',
            header: 'Name',
        },
        {
            accessorKey: 'category',
            header: 'Category',
            cell: ({ row }) => (
                <span className="capitalize">{row.original.category ?? '—'}</span>
            ),
        },
        {
            accessorKey: 'price',
            header: 'Price',
            cell: ({ row }) => formatCurrency(row.original.price),
        },
        {
            accessorKey: 'stock_quantity',
            header: 'Stock',
            cell: ({ row }) => {
                const lowStock = row.original.stock_quantity <= row.original.low_stock_threshold;

                return (
                    <span
                        className={cn(
                            'font-medium',
                            lowStock && 'text-red-600 dark:text-red-400',
                        )}
                    >
                        {row.original.stock_quantity}
                        {lowStock && (
                            <Badge
                                variant="outline"
                                className="ml-2 border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400"
                            >
                                Low stock
                            </Badge>
                        )}
                    </span>
                );
            },
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
        },
        {
            id: 'actions',
            header: '',
            cell: ({ row }) => (
                <Button variant="ghost" size="icon" asChild>
                    <Link href={edit(row.original)}>
                        <Pencil className="size-4" />
                    </Link>
                </Button>
            ),
        },
    ];

    return (
        <>
            <Head title="Inventory" />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <PageHeader
                    title="Inventory"
                    description="Manage products, stock levels, and pricing"
                    actions={
                        <Button asChild>
                            <Link href={create()}>
                                <Plus className="size-4" />
                                New Product
                            </Link>
                        </Button>
                    }
                />

                <div className="flex items-center gap-2">
                    <Checkbox
                        id="low_stock"
                        checked={filters.low_stock ?? false}
                        onCheckedChange={(checked) => toggleLowStock(checked === true)}
                    />
                    <Label htmlFor="low_stock">Low stock only</Label>
                </div>

                <DataTable
                    columns={columns}
                    data={products.data}
                    pagination={products}
                    searchPlaceholder="Search products..."
                    searchValue={filters.search}
                    onSearch={handleSearch}
                    emptyIcon={Package}
                    emptyTitle="No products found"
                    emptyDescription="Add a product or adjust your filters."
                />
            </div>
        </>
    );
}

InventoryIndex.layout = {
    breadcrumbs: [{ title: 'Inventory', href: productsIndex() }],
};
