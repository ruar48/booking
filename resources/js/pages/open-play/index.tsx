import { Head, Link, router } from '@inertiajs/react';
import { type ColumnDef } from '@tanstack/react-table';
import { CalendarDays, Pencil, Plus, Users } from 'lucide-react';
import { useCallback } from 'react';

import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { formatCurrency, formatDate, formatTime } from '@/lib/format';
import { create, edit, manage, index as openPlayIndex } from '@/routes/open-play';
import type { ClubEvent, Paginated } from '@/types/booking';

type Filters = {
    search?: string | null;
    status?: string | null;
    bracket_format?: string | null;
    date_from?: string | null;
    date_to?: string | null;
    sort?: string | null;
};

type Props = {
    sessions: Paginated<ClubEvent>;
    upcomingCount: number;
    filters: Filters;
};

const ANY_VALUE = 'any';

function formatSkillLevel(level?: string): string {
    if (!level || level === 'all_levels') {
        return 'All levels';
    }

    return level.charAt(0).toUpperCase() + level.slice(1);
}

function sessionStatus(startsAt: string): 'upcoming' | 'past' {
    return new Date(startsAt) >= new Date() ? 'upcoming' : 'past';
}

export default function OpenPlayIndex({ sessions, upcomingCount, filters }: Props) {
    const applyFilters = useCallback(
        (next: Partial<Filters>) => {
            router.get(
                openPlayIndex().url,
                {
                    search: filters.search || undefined,
                    status: filters.status || undefined,
                    bracket_format: filters.bracket_format || undefined,
                    date_from: filters.date_from || undefined,
                    date_to: filters.date_to || undefined,
                    sort: filters.sort || undefined,
                    ...next,
                },
                { preserveState: true, preserveScroll: true, replace: true },
            );
        },
        [filters],
    );

    const handleSearch = useCallback(
        (value: string) => applyFilters({ search: value || undefined }),
        [applyFilters],
    );

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
                    ? `${row.original.registrations_count ?? 0} / ${row.original.max_players}`
                    : (row.original.registrations_count ?? 0),
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
                <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" asChild title="Manage players & bracket">
                        <Link href={manage(row.original)}>
                            <Users className="size-4" />
                        </Link>
                    </Button>
                    <Button variant="ghost" size="icon" asChild title="Edit session">
                        <Link href={edit(row.original)}>
                            <Pencil className="size-4" />
                        </Link>
                    </Button>
                </div>
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
                    searchPlaceholder="Search sessions..."
                    searchValue={filters.search ?? ''}
                    onSearch={handleSearch}
                    filters={
                        <>
                            <Select
                                value={filters.status || ANY_VALUE}
                                onValueChange={(value) =>
                                    applyFilters({
                                        status: value === ANY_VALUE ? undefined : value,
                                    })
                                }
                            >
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={ANY_VALUE}>All statuses</SelectItem>
                                    <SelectItem value="upcoming">Upcoming</SelectItem>
                                    <SelectItem value="past">Past</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select
                                value={filters.bracket_format || ANY_VALUE}
                                onValueChange={(value) =>
                                    applyFilters({
                                        bracket_format: value === ANY_VALUE ? undefined : value,
                                    })
                                }
                            >
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="Bracket format" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={ANY_VALUE}>All formats</SelectItem>
                                    <SelectItem value="round_robin">Round robin</SelectItem>
                                    <SelectItem value="single_elimination">
                                        Single elimination
                                    </SelectItem>
                                    <SelectItem value="double_elimination">
                                        Double elimination
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <Input
                                type="date"
                                className="w-40"
                                value={filters.date_from ?? ''}
                                onChange={(e) =>
                                    applyFilters({ date_from: e.target.value || undefined })
                                }
                            />
                            <span className="text-muted-foreground text-sm">to</span>
                            <Input
                                type="date"
                                className="w-40"
                                value={filters.date_to ?? ''}
                                onChange={(e) =>
                                    applyFilters({ date_to: e.target.value || undefined })
                                }
                            />
                            <Select
                                value={filters.sort || 'upcoming'}
                                onValueChange={(value) => applyFilters({ sort: value })}
                            >
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Sort" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="upcoming">Soonest first</SelectItem>
                                    <SelectItem value="latest">Latest first</SelectItem>
                                </SelectContent>
                            </Select>
                        </>
                    }
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
