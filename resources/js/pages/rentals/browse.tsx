import { Head, Link, router } from '@inertiajs/react';
import { addDays, format } from 'date-fns';
import { CalendarClock, Dumbbell, ListOrdered, Minus, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';
import { browse as rentalsBrowse, mine as rentalsMine, rent } from '@/routes/rentals';
import type { RentalItem } from '@/types/rentals';

type Props = {
    rentalItems: RentalItem[];
};

export default function RentalsBrowse({ rentalItems }: Props) {
    return (
        <>
            <Head title="Rentals" />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <PageHeader
                    title="Rentals"
                    description="Rent paddles, balls, and other equipment for your session."
                    actions={
                        <Button variant="outline" asChild>
                            <Link href={rentalsMine()}>
                                <ListOrdered className="size-4" />
                                My rentals
                            </Link>
                        </Button>
                    }
                />

                {rentalItems.length === 0 ? (
                    <Card>
                        <CardContent className="text-muted-foreground py-16 text-center text-sm">
                            No rental items are available right now.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {rentalItems.map((rentalItem) => (
                            <RentalItemCard key={rentalItem.id} rentalItem={rentalItem} />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

function SegmentedToggle<T extends string>({
    value,
    options,
    onChange,
}: {
    value: T;
    options: { value: T; label: string }[];
    onChange: (value: T) => void;
}) {
    return (
        <div className="bg-muted inline-flex rounded-lg p-0.5 text-xs font-medium">
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    onClick={() => onChange(option.value)}
                    className={cn(
                        'rounded-md px-2.5 py-1 transition-colors',
                        value === option.value
                            ? 'bg-background shadow-sm'
                            : 'text-muted-foreground hover:text-foreground',
                    )}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}

function RentalItemCard({ rentalItem }: { rentalItem: RentalItem }) {
    const [quantity, setQuantity] = useState(1);
    const [processing, setProcessing] = useState(false);
    const [when, setWhen] = useState<'today' | 'later'>('today');
    const [reservedFor, setReservedFor] = useState('');
    const [durationType, setDurationType] = useState<'daily' | 'hourly'>('daily');
    const [hours, setHours] = useState(1);

    const outOfStock = rentalItem.available_quantity <= 0;
    const hasHourlyOption = rentalItem.hourly_rate != null && Number(rentalItem.hourly_rate) > 0;
    const maxQuantity = when === 'today' ? rentalItem.available_quantity : rentalItem.total_quantity;
    const minDate = format(addDays(new Date(), 1), 'yyyy-MM-dd');

    const estimatedTotal = useMemo(() => {
        const unitRate =
            durationType === 'hourly'
                ? Number(rentalItem.hourly_rate ?? rentalItem.rate) * hours
                : Number(rentalItem.rate);

        return unitRate * quantity;
    }, [durationType, hours, quantity, rentalItem.hourly_rate, rentalItem.rate]);

    const canSubmit =
        (when === 'today' ? !outOfStock : true) &&
        (when === 'later' ? reservedFor !== '' : true) &&
        maxQuantity > 0;

    const submit = () => {
        router.post(
            rent().url,
            {
                rental_item_id: rentalItem.id,
                quantity,
                duration_type: durationType,
                duration_hours: durationType === 'hourly' ? hours : undefined,
                reserved_for: when === 'later' ? reservedFor : undefined,
            },
            {
                preserveScroll: true,
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
                onSuccess: () => {
                    setQuantity(1);
                    setWhen('today');
                    setReservedFor('');
                },
            },
        );
    };

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base">{rentalItem.name}</CardTitle>
                <p className="text-xs text-muted-foreground">
                    {rentalItem.category ?? 'Uncategorized'}
                </p>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Rate</span>
                    <span className="font-semibold">
                        {formatCurrency(rentalItem.rate)}
                        {hasHourlyOption && (
                            <span className="text-muted-foreground font-normal">
                                {' '}
                                / day · {formatCurrency(rentalItem.hourly_rate)}/hr
                            </span>
                        )}
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Available</span>
                    <span>{outOfStock ? 'Out of stock' : `${rentalItem.available_quantity} left`}</span>
                </div>

                <div className="flex items-center justify-between border-t pt-3">
                    <span className="text-muted-foreground">When</span>
                    <SegmentedToggle
                        value={when}
                        onChange={setWhen}
                        options={[
                            { value: 'today', label: 'Today' },
                            { value: 'later', label: 'Reserve' },
                        ]}
                    />
                </div>

                {when === 'later' && (
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-1 text-xs">
                            <CalendarClock className="size-3.5" />
                            Date
                        </span>
                        <Input
                            type="date"
                            min={minDate}
                            value={reservedFor}
                            onChange={(e) => setReservedFor(e.target.value)}
                            className="h-8 w-36 text-xs"
                        />
                    </div>
                )}

                {hasHourlyOption && (
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Duration</span>
                        <SegmentedToggle
                            value={durationType}
                            onChange={setDurationType}
                            options={[
                                { value: 'daily', label: 'Whole day' },
                                { value: 'hourly', label: 'Per hour' },
                            ]}
                        />
                    </div>
                )}

                {hasHourlyOption && durationType === 'hourly' && (
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-xs">Hours</span>
                        <div className="flex items-center gap-1">
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="size-7"
                                onClick={() => setHours((h) => Math.max(1, h - 1))}
                            >
                                <Minus className="size-3" />
                            </Button>
                            <span className="w-6 text-center text-xs">{hours}</span>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="size-7"
                                disabled={hours >= 12}
                                onClick={() => setHours((h) => Math.min(12, h + 1))}
                            >
                                <Plus className="size-3" />
                            </Button>
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between border-t pt-3 text-xs">
                    <span className="text-muted-foreground">Estimated total</span>
                    <span className="font-semibold">{formatCurrency(estimatedTotal)}</span>
                </div>

                {maxQuantity <= 0 ? (
                    <Button className="w-full" disabled>
                        Out of stock
                    </Button>
                ) : (
                    <div className="flex items-center gap-2 pt-1">
                        <div className="flex items-center gap-1">
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="size-8"
                                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                            >
                                <Minus className="size-3" />
                            </Button>
                            <span className="w-6 text-center">{quantity}</span>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="size-8"
                                disabled={quantity >= maxQuantity}
                                onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                            >
                                <Plus className="size-3" />
                            </Button>
                        </div>
                        <Button
                            className="flex-1"
                            disabled={processing || !canSubmit}
                            onClick={submit}
                        >
                            <Dumbbell className="size-4" />
                            {when === 'today' ? 'Rent' : 'Reserve'}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

RentalsBrowse.layout = {
    breadcrumbs: [{ title: 'Rentals', href: rentalsBrowse() }],
};
