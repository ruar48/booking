import { Head, Link, usePage } from '@inertiajs/react';

import { CourtScheduleGrid } from '@/components/court-schedule-grid';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { create, index as bookingsIndex } from '@/routes/bookings';
import type { BookedSlot, Club, Resource } from '@/types/booking';

type Props = {
    club: Club | null;
    resources: Resource[];
    bookedSlots: BookedSlot[];
};

export default function BookingsCreate({ club, resources, bookedSlots }: Props) {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="Book a Court" />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <PageHeader
                    title="Book a court"
                    description="Select open time slots on Court 1 or Court 2"
                    actions={
                        <Button variant="outline" asChild>
                            <Link href={bookingsIndex()}>My bookings</Link>
                        </Button>
                    }
                />
                <Card className="mx-auto w-full max-w-4xl">
                    <CardContent className="pt-6">
                        <CourtScheduleGrid
                            courts={resources}
                            club={club}
                            bookedSlots={bookedSlots}
                            isAuthenticated={!!auth.user}
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
