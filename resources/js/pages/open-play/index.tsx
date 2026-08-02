import { Head, Link } from '@inertiajs/react';
import { type ColumnDef } from '@tanstack/react-table';
import { CalendarDays, Pencil, Plus } from 'lucide-react';

import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, formatTime } from '@/lib/format';
import { create, edit, index as openPlayIndex } from '@/routes/open-play';
import type { ClubEvent, Paginated } from '@/types/booking';

type Props = {
    sessions: Paginated<ClubEvent>;
    upcomingCount: number;
};

function formatSkillLevel(level?: string): string {
    if (!level || level === 'all_levels') {
        return 'All levels';
    }

    return level.charAt(0).toUpperCase() + level.slice(1);
}

function sessionStatus(startsAt: string): 'upcoming' | 'past' {
    return new Date(startsAt) >= new Date() ? 'upcoming' : 'past';
}

export default function OpenPlayIndex({ sessions, upcomingCount }: Props) {
    const columns: ColumnDef<ClubEvent>[] = [
        {
            accessorKey: 'title',
            header: 'Session',
            cell: ({ row }) => (
                <Link href={edit(row.original)} className="font-medium hover:underline">
                    {row.original.title}
                </Link>
            ),
        },
        {
            accessorKey: 'starts_at',
            header: 'Date',
            cell: ({ row }) => formatDate(row.original.starts_at),
        },
        {
            id: 'time',
            header: 'Time',
            cell: ({ row }) => (
                <span className="whitespace-nowrap">
                    {formatTime(row.original.starts_at)}
                    {row.original.ends_at && ` – ${formatTime(row.original.ends_at)}`}
                </span>
            ),
        },
        {
            accessorKey: 'location',
            header: 'Courts',
            cell: ({ row }) => row.original.location ?? '—',
        },
        {
            id: 'players',
            header: 'Players',
            cell: ({ row }) =>
                row.original.max_players
                    ? `0 / ${row.original.max_players}`
                    : '—',
        },
        {
            accessorKey: 'price_per_player',
            header: 'Price',
            cell: ({ row }) =>
                row.original.price_per_player != null
                    ? formatCurrency(row.original.price_per_player)
                    : '—',
        },
        {
            id: 'status',
            header: 'Status',
            cell: ({ row }) => (
                <Badge
                    variant={
                        sessionStatus(row.original.starts_at) === 'upcoming'
                            ? 'default'
                            : 'secondary'
                    }
                >
                    {sessionStatus(row.original.starts_at) === 'upcoming'
                        ? 'Upcoming'
                        : 'Past'}
                </Badge>
            ),
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
            <Head title="Open Play" />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <PageHeader
                    title="Open play"
                    description={`Schedule and monitor drop-in sessions · ${upcomingCount} upcoming`}
                    actions={
                        <Button asChild>
                            <Link href={create()}>
                                <Plus className="size-4" />
                                New session
                            </Link>
                        </Button>
                    }
                />
                <DataTable
                    columns={columns}
                    data={sessions.data}
                    pagination={sessions}
                    emptyIcon={CalendarDays}
                    emptyTitle="No open play sessions"
                    emptyDescription="Create a session for members to register on your public page."
                />
            </div>
        </>
    );
}

OpenPlayIndex.layout = {
    breadcrumbs: [{ title: 'Open play', href: openPlayIndex() }],
};
