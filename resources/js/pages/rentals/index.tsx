import { Head, Link, router } from '@inertiajs/react';
import { type ColumnDef } from '@tanstack/react-table';
import { BarChart3, Dumbbell, ListOrdered, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useState } from 'react';

import { ConfirmDialog } from '@/components/confirm-dialog';
import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { checkout as rentalsCheckout, report as rentalsReport } from '@/routes/rentals';
import { create, destroy, edit, index as rentalItemsIndex } from '@/routes/rental-items';
import { index as rentalTransactionsIndex } from '@/routes/rentals/transactions';
import type { Paginated } from '@/types/booking';
import type { RentalItem } from '@/types/rentals';

type Props = {
    rentalItems: Paginated<RentalItem>;
    filters: {
        search?: string;
        low_stock?: boolean;
    };
};

export default function RentalsIndex({ rentalItems, filters }: Props) {
    const [itemToDelete, setItemToDelete] = useState<RentalItem | null>(null);

    const handleSearch = useCallback(
        (value: string) => {
            router.get(
                rentalItemsIndex().url,
                { ...filters, search: value || undefined },
                { preserveState: true, replace: true },
            );
        },
        [filters],
    );

    const toggleOutOfStock = (checked: boolean) => {
        router.get(
            rentalItemsIndex().url,
            { ...filters, low_stock: checked ? 1 : undefined },
            { preserveState: true, replace: true },
        );
    };

    const columns: ColumnDef<RentalItem>[] = [
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
            accessorKey: 'rate',
            header: 'Rate',
            cell: ({ row }) => formatCurrency(row.original.rate),
        },
        {
            accessorKey: 'available_quantity',
            header: 'Availability',
            cell: ({ row }) => {
                const outOfStock = row.original.available_quantity <= 0;

                return (
                    <span
                        className={cn(
                            'font-medium',
                            outOfStock && 'text-red-600 dark:text-red-400',
                        )}
                    >
                        {row.original.available_quantity} / {row.original.total_quantity}
                        {outOfStock && (
                            <Badge
                                variant="outline"
                                className="ml-2 border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400"
                            >
                                Out of stock
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
            id: 'revenue',
            header: 'Revenue',
            cell: ({ row }) => formatCurrency(row.original.revenue ?? 0),
        },
        {
            id: 'actions',
            header: '',
            cell: ({ row }) => (
                <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={edit(row.original)}>
                            <Pencil className="size-4" />
                        </Link>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setItemToDelete(row.original)}
                    >
                        <Trash2 className="size-4 text-destructive" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <>
            <Head title="Rentals" />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <PageHeader
                    title="Rentals"
                    description="Manage rental equipment and availability"
                    actions={
                        <>
                            <Button variant="outline" asChild>
                                <Link href={rentalsReport()}>
                                    <BarChart3 className="size-4" />
                                    Report
                                </Link>
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href={rentalTransactionsIndex()}>
                                    <ListOrdered className="size-4" />
                                    Transactions
                                </Link>
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href={rentalsCheckout()}>
                                    <Dumbbell className="size-4" />
                                    Rent out
                                </Link>
                            </Button>
                            <Button asChild>
                                <Link href={create()}>
                                    <Plus className="size-4" />
                                    New Rental Item
                                </Link>
                            </Button>
                        </>
                    }
                />

                <div className="flex items-center gap-2">
                    <Checkbox
                        id="low_stock"
                        checked={filters.low_stock ?? false}
                        onCheckedChange={(checked) => toggleOutOfStock(checked === true)}
                    />
                    <Label htmlFor="low_stock">Out of stock only</Label>
                </div>

                <DataTable
                    columns={columns}
                    data={rentalItems.data}
                    pagination={rentalItems}
                    searchPlaceholder="Search rental items..."
                    searchValue={filters.search}
                    onSearch={handleSearch}
                    emptyIcon={Dumbbell}
                    emptyTitle="No rental items found"
                    emptyDescription="Add a rental item or adjust your filters."
                />
            </div>

            <ConfirmDialog
                open={itemToDelete !== null}
                onOpenChange={(open) => !open && setItemToDelete(null)}
                title="Delete rental item"
                description={
                    itemToDelete
                        ? `This will permanently remove "${itemToDelete.name}".`
                        : undefined
                }
                confirmLabel="Delete"
                variant="destructive"
                onConfirm={() => {
                    if (itemToDelete) {
                        router.delete(destroy(itemToDelete).url, {
                            onSuccess: () => setItemToDelete(null),
                        });
                    }
                }}
            />
        </>
    );
}

RentalsIndex.layout = {
    breadcrumbs: [{ title: 'Rentals', href: rentalItemsIndex() }],
};
