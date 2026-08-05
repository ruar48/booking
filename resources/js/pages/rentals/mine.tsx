import { Head, Link } from '@inertiajs/react';
import {
    CalendarClock,
    Package,
    PackageCheck,
    PackageSearch,
    PhilippinePeso,
    Plus,
    TriangleAlert,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { PageHeader } from '@/components/page-header';
import { StatTile } from '@/components/stat-tile';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatDate } from '@/lib/format';
import {
    DueBadge,
    formatDueLabel,
    formatDurationLabel,
    formatReservedForLabel,
    getDueMeta,
    getRentalItemIcon,
} from '@/lib/rental-display';
import { browse as rentalsBrowse, mine as rentalsMine } from '@/routes/rentals';
import type { RentalTransaction } from '@/types/rentals';

type Props = {
    transactions: RentalTransaction[];
};

function RentalCard({ transaction }: { transaction: RentalTransaction }) {
    const items = transaction.items ?? [];
    const primaryItem = items[0];
    const Icon = primaryItem ? getRentalItemIcon(primaryItem.rental_item_name) : Package;
    const dueMeta = getDueMeta(transaction);

    return (
        <Card>
            <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                        <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-lg">
                            <Icon className="text-muted-foreground size-5" />
                        </div>
                        <div>
                            <p className="text-sm leading-tight font-semibold">
                                {primaryItem
                                    ? primaryItem.rental_item_name
                                    : transaction.reference_number}
                                {items.length > 1 && (
                                    <span className="text-muted-foreground font-normal">
                                        {' '}
                                        +{items.length - 1} more
                                    </span>
                                )}
                            </p>
                            <p className="text-muted-foreground text-xs">
                                Rental #{transaction.reference_number.split('-').pop()} ·{' '}
                                {formatDate(transaction.rented_at)} · {formatDurationLabel(transaction)}
                            </p>
                        </div>
                    </div>
                    <DueBadge tone={dueMeta.tone} label={dueMeta.label} />
                </div>

                {items.length > 1 && (
                    <div className="space-y-1 border-t pt-2 text-sm">
                        {items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between">
                                <span>
                                    {item.rental_item_name} × {item.quantity}
                                </span>
                                <span className="text-muted-foreground text-xs">
                                    {item.quantity_returned >= item.quantity
                                        ? 'Returned'
                                        : `${item.quantity - item.quantity_returned} outstanding`}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                <div className="grid grid-cols-3 gap-2 border-t pt-3 text-center">
                    <div>
                        <p className="text-muted-foreground text-xs">Qty</p>
                        <p className="text-sm font-semibold">
                            {items.reduce((sum, item) => sum + item.quantity, 0) || '—'}
                        </p>
                    </div>
                    <div>
                        <p className="text-muted-foreground text-xs">
                            {transaction.status === 'reserved' ? 'Reserved for' : 'Due'}
                        </p>
                        <p className="text-sm font-semibold">
                            {transaction.status === 'reserved'
                                ? formatReservedForLabel(transaction.reserved_for)
                                : transaction.status === 'returned'
                                  ? formatDate(transaction.returned_at)
                                  : formatDueLabel(transaction.due_at)}
                        </p>
                    </div>
                    <div>
                        <p className="text-muted-foreground text-xs">Total</p>
                        <p className="text-sm font-semibold">
                            {formatCurrency(transaction.total_amount)}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function RentalsMine({ transactions }: Props) {
    const [filter, setFilter] = useState<'all' | 'active' | 'overdue' | 'reserved' | 'returned'>('all');

    const stats = useMemo(() => {
        const active = transactions.filter((t) => t.status === 'active').length;
        const overdue = transactions.filter((t) => getDueMeta(t).tone === 'red').length;
        const reserved = transactions.filter((t) => t.status === 'reserved').length;
        const returned = transactions.filter((t) => t.status === 'returned').length;
        const spent = transactions.reduce((sum, t) => sum + Number(t.total_amount || 0), 0);

        return { active, overdue, reserved, returned, spent };
    }, [transactions]);

    const filtered = useMemo(() => {
        if (filter === 'all') return transactions;
        if (filter === 'overdue') return transactions.filter((t) => getDueMeta(t).tone === 'red');

        return transactions.filter((t) => t.status === filter);
    }, [transactions, filter]);

    return (
        <>
            <Head title="My Rentals" />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <PageHeader
                    title="🎒 My equipment rentals"
                    description={`Manage your rentals and return schedule · ${stats.active} active`}
                    actions={
                        <Button asChild>
                            <Link href={rentalsBrowse()}>
                                <Plus className="size-4" />
                                Rent equipment
                            </Link>
                        </Button>
                    }
                />

                {transactions.length === 0 ? (
                    <Card>
                        <CardContent className="text-muted-foreground py-16 text-center text-sm">
                            You haven&apos;t rented any equipment yet.
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                            <StatTile icon={PackageSearch} label="Active" value={stats.active} />
                            <StatTile icon={TriangleAlert} label="Overdue" value={stats.overdue} />
                            <StatTile icon={CalendarClock} label="Reserved" value={stats.reserved} />
                            <StatTile icon={PackageCheck} label="Returned" value={stats.returned} />
                            <StatTile
                                icon={PhilippinePeso}
                                label="Total spent"
                                value={formatCurrency(stats.spent)}
                            />
                        </div>

                        <Tabs value={filter} onValueChange={(value) => setFilter(value as typeof filter)}>
                            <TabsList>
                                <TabsTrigger value="all">All</TabsTrigger>
                                <TabsTrigger value="active">Active</TabsTrigger>
                                <TabsTrigger value="overdue">Overdue</TabsTrigger>
                                <TabsTrigger value="reserved">Reserved</TabsTrigger>
                                <TabsTrigger value="returned">Returned</TabsTrigger>
                            </TabsList>
                        </Tabs>

                        {filtered.length === 0 ? (
                            <Card>
                                <CardContent className="text-muted-foreground py-16 text-center text-sm">
                                    No rentals match this filter.
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {filtered.map((transaction) => (
                                    <RentalCard key={transaction.id} transaction={transaction} />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    );
}

RentalsMine.layout = {
    breadcrumbs: [{ title: 'My rentals', href: rentalsMine() }],
};
