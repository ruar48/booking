import {
    type ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from '@tanstack/react-table';
import type { LucideIcon } from 'lucide-react';
import { Search } from 'lucide-react';
import { type ReactNode, useState } from 'react';

import { EmptyState } from '@/components/empty-state';
import { PaginationLinks } from '@/components/pagination-links';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { Paginated } from '@/types/booking';

type DataTableProps<TData, TValue> = {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    pagination?: Paginated<TData>;
    searchPlaceholder?: string;
    onSearch?: (value: string) => void;
    searchValue?: string;
    emptyIcon?: LucideIcon;
    emptyTitle?: string;
    emptyDescription?: string;
    loading?: boolean;
    /** Noun for the pagination summary, e.g. "booking" → "of 7 bookings". */
    paginationUnit?: string;
    filters?: ReactNode;
    rowClassName?: (row: TData) => string | undefined;
    renderCard?: (row: TData) => ReactNode;
};

export function DataTable<TData, TValue>({
    columns,
    data,
    pagination,
    searchPlaceholder = 'Search...',
    onSearch,
    searchValue,
    emptyIcon: EmptyIcon,
    emptyTitle = 'No results found',
    emptyDescription = 'Try adjusting your search or filters.',
    loading = false,
    paginationUnit,
    filters,
    rowClassName,
    renderCard,
}: DataTableProps<TData, TValue>) {
    const [internalSearch, setInternalSearch] = useState(searchValue ?? '');

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    const handleSearchChange = (value: string) => {
        setInternalSearch(value);
        onSearch?.(value);
    };

    return (
        <div className="space-y-4">
            {onSearch || filters ? (
                <div className="bg-card flex flex-col gap-2 rounded-xl border p-3 sm:flex-row sm:flex-wrap sm:items-center">
                    {onSearch ? (
                        // Full width on a phone; a bounded column once there is
                        // room to sit beside the filters.
                        <div className="relative w-full sm:max-w-sm sm:flex-1">
                            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                            <Input
                                placeholder={searchPlaceholder}
                                value={searchValue ?? internalSearch}
                                onChange={(event) =>
                                    handleSearchChange(event.target.value)
                                }
                                className="pl-9"
                            />
                        </div>
                    ) : null}
                    {filters}
                </div>
            ) : null}

            {renderCard ? (
                <div className="sm:hidden">
                    {loading ? (
                        <div className="grid gap-3">
                            {Array.from({ length: 3 }).map((_, index) => (
                                <Skeleton key={index} className="h-24 w-full rounded-xl" />
                            ))}
                        </div>
                    ) : data.length ? (
                        <div className="grid gap-3">
                            {data.map((row, index) => (
                                <div key={index}>{renderCard(row)}</div>
                            ))}
                        </div>
                    ) : EmptyIcon ? (
                        <EmptyState
                            icon={EmptyIcon}
                            title={emptyTitle}
                            description={emptyDescription}
                        />
                    ) : (
                        <div className="text-muted-foreground rounded-xl border p-8 text-center text-sm">
                            {emptyTitle}
                        </div>
                    )}
                </div>
            ) : null}

            <div
                className={cn(
                    'bg-card overflow-hidden rounded-xl border',
                    renderCard ? 'hidden sm:block' : undefined,
                )}
            >
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                  header.column.columnDef
                                                      .header,
                                                  header.getContext(),
                                              )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, index) => (
                                <TableRow key={index}>
                                    {columns.map((_, colIndex) => (
                                        <TableCell key={colIndex}>
                                            <Skeleton className="h-4 w-full" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    className={rowClassName?.(row.original)}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext(),
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-48 p-0"
                                >
                                    {EmptyIcon ? (
                                        <EmptyState
                                            icon={EmptyIcon}
                                            title={emptyTitle}
                                            description={emptyDescription}
                                            className="border-0"
                                        />
                                    ) : (
                                        <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
                                            {emptyTitle}
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {pagination ? (
                <PaginationLinks pagination={pagination} unit={paginationUnit} />
            ) : null}
        </div>
    );
}
