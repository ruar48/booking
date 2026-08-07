import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

import { CourtScheduleGrid, type WalkInCustomerPayload } from '@/components/court-schedule-grid';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { create, index as bookingsIndex } from '@/routes/bookings';
import customers from '@/routes/bookings/customers';
import type { BookedSlot, DateOverride, RecurringScheduleLock, Resource, ScheduleBlock } from '@/types/booking';

type Props = {
    resources: Resource[];
    bookedSlots: BookedSlot[];
    scheduleBlocks?: ScheduleBlock[];
    recurringLocks?: RecurringScheduleLock[];
    dateOverrides?: DateOverride[];
    canManage: boolean;
};

type BookingForMode = 'myself' | 'existing' | 'new';

type CustomerSearchResult = {
    id: number;
    name: string;
    phone: string | null;
};

export default function BookingsCreate({ resources, bookedSlots, scheduleBlocks = [], recurringLocks = [], dateOverrides = [], canManage }: Props) {
    const { auth } = usePage().props;

    const [mode, setMode] = useState<BookingForMode>('myself');
    const [markPaid, setMarkPaid] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<CustomerSearchResult[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerSearchResult | null>(null);

    const [newName, setNewName] = useState('');
    const [newPhone, setNewPhone] = useState('');

    useEffect(() => {
        if (mode !== 'existing' || selectedCustomer || searchQuery.trim().length < 2) {
            setSearchResults([]);
            return;
        }

        const handle = window.setTimeout(() => {
            fetch(customers.search.url({ query: { q: searchQuery } }), {
                headers: { Accept: 'application/json' },
            })
                .then((response) => (response.ok ? response.json() : []))
                .then((data: CustomerSearchResult[]) => setSearchResults(data))
                .catch(() => setSearchResults([]));
        }, 300);

        return () => window.clearTimeout(handle);
    }, [searchQuery, mode, selectedCustomer]);

    const customerPayload: WalkInCustomerPayload | null = useMemo(() => {
        if (mode === 'existing' && selectedCustomer) {
            return { mode: 'existing', user_id: selectedCustomer.id };
        }

        if (mode === 'new' && newName.trim() && newPhone.trim()) {
            return { mode: 'new', name: newName.trim(), phone: newPhone.trim() };
        }

        return null;
    }, [mode, selectedCustomer, newName, newPhone]);

    return (
        <>
            <Head title="Book a Court" />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <PageHeader
                    title="Book a court"
                    description="Select open time slots for your chosen sport"
                    actions={
                        <Button variant="outline" asChild>
                            <Link href={bookingsIndex()}>My bookings</Link>
                        </Button>
                    }
                />
                {canManage && (
                    <Card className="mx-auto w-full max-w-4xl">
                        <CardContent className="space-y-4 pt-6">
                            <div className="space-y-2">
                                <Label>Booking for</Label>
                                <ToggleGroup
                                    type="single"
                                    variant="outline"
                                    value={mode}
                                    onValueChange={(value) => {
                                        if (!value) {
                                            return;
                                        }
                                        setMode(value as BookingForMode);
                                        setSelectedCustomer(null);
                                        setSearchQuery('');
                                        setSearchResults([]);
                                        setNewName('');
                                        setNewPhone('');
                                    }}
                                >
                                    <ToggleGroupItem value="myself">Myself</ToggleGroupItem>
                                    <ToggleGroupItem value="existing">Existing customer</ToggleGroupItem>
                                    <ToggleGroupItem value="new">New walk-in customer</ToggleGroupItem>
                                </ToggleGroup>
                            </div>

                            {mode === 'existing' && (
                                <div className="relative space-y-2">
                                    <Label htmlFor="customer-search">Search customer</Label>
                                    {selectedCustomer ? (
                                        <div className="flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm">
                                            <span className="font-medium">{selectedCustomer.name}</span>
                                            {selectedCustomer.phone && (
                                                <span className="text-muted-foreground">
                                                    {selectedCustomer.phone}
                                                </span>
                                            )}
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="ml-auto"
                                                onClick={() => setSelectedCustomer(null)}
                                            >
                                                Change
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <Input
                                                id="customer-search"
                                                placeholder="Search by name or phone"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                autoComplete="off"
                                            />
                                            {searchResults.length > 0 && (
                                                <div className="absolute z-10 w-full rounded-md border border-input bg-popover shadow-md">
                                                    {searchResults.map((result) => (
                                                        <button
                                                            key={result.id}
                                                            type="button"
                                                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                                                            onClick={() => {
                                                                setSelectedCustomer(result);
                                                                setSearchResults([]);
                                                            }}
                                                        >
                                                            <span className="font-medium">{result.name}</span>
                                                            {result.phone && (
                                                                <span className="text-muted-foreground">
                                                                    {result.phone}
                                                                </span>
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            {mode === 'new' && (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="walk-in-name">Name</Label>
                                        <Input
                                            id="walk-in-name"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="walk-in-phone">Phone</Label>
                                        <Input
                                            id="walk-in-phone"
                                            value={newPhone}
                                            onChange={(e) => setNewPhone(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            {mode !== 'myself' && (
                                <label className="flex items-center gap-2 text-sm">
                                    <Checkbox
                                        checked={markPaid}
                                        onCheckedChange={(checked) => setMarkPaid(checked === true)}
                                    />
                                    Mark as paid now
                                </label>
                            )}
                        </CardContent>
                    </Card>
                )}
                <Card className="mx-auto w-full max-w-4xl">
                    <CardContent className="pt-6">
                        <CourtScheduleGrid
                            courts={resources}
                            bookedSlots={bookedSlots}
                            scheduleBlocks={scheduleBlocks}
                            recurringLocks={recurringLocks}
                            dateOverrides={dateOverrides}
                            isAuthenticated={!!auth.user}
                            customer={customerPayload}
                            markPaid={markPaid}
                        />
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

BookingsCreate.layout = {
    breadcrumbs: [
        { title: 'Bookings', href: bookingsIndex() },
        { title: 'Book a court', href: create() },
    ],
};
