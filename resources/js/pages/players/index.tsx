import { Head, Link, router } from '@inertiajs/react';
import { type ColumnDef } from '@tanstack/react-table';
import { Eye, Pencil, Plus, Users } from 'lucide-react';
import { useCallback } from 'react';

import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { create, edit, index as playersIndex, show } from '@/routes/players';
import type { Paginated, Player } from '@/types/booking';

type Props = {
    players: Paginated<Player>;
    filters: {
        search?: string;
        experience_level?: string;
    };
};

export default function PlayersIndex({ players, filters }: Props) {
    const handleSearch = useCallback(
        (value: string) => {
            router.get(
                playersIndex().url,
                { ...filters, search: value || undefined },
                { preserveState: true, replace: true },
            );
        },
        [filters],
    );

    const handleFilter = (key: string, value: string) => {
        router.get(
            playersIndex().url,
            { ...filters, [key]: value === 'all' ? undefined : value },
            { preserveState: true, replace: true },
        );
    };

    const columns: ColumnDef<Player>[] = [
        {
            accessorKey: 'name',
            header: 'Player',
            cell: ({ row }) => (
                <Link
                    href={show(row.original)}
                    className="font-medium hover:underline"
                >
                    {row.original.user?.name ?? `Player #${row.original.id}`}
                </Link>
            ),
        },
        {
            accessorKey: 'experience_level',
            header: 'Level',
            cell: ({ row }) => (
                <span className="capitalize">
                    {row.original.experience_level}
                </span>
            ),
        },
        {
            accessorKey: 'skill_rating',
            header: 'Rating',
            cell: ({ row }) => row.original.skill_rating,
        },
        {
            accessorKey: 'is_active',
            header: 'Status',
            cell: ({ row }) => (
                <StatusBadge
                    status={row.original.is_active ? 'active' : 'inactive'}
                />
            ),
        },
        {
            id: 'actions',
            header: '',
            cell: ({ row }) => (
                <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={show(row.original)}>
                            <Eye className="size-4" />
                        </Link>
                    </Button>
                    <Button variant="ghost" size="icon" asChild>
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
            <Head title="Members" />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <PageHeader
                    title="Members"
                    description="People who book courts at your venue"
                    actions={
                        <Button asChild>
                            <Link href={create()}>
                                <Plus className="size-4" />
                                New player
                            </Link>
                        </Button>
                    }
                />

                <div className="flex flex-wrap gap-3">
                    <Select
                        value={filters.experience_level ?? 'all'}
                        onValueChange={(v) => handleFilter('experience_level', v)}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Experience level" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All levels</SelectItem>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                            <SelectItem value="professional">Professional</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <DataTable
                    columns={columns}
                    data={players.data}
                    pagination={players}
                    searchPlaceholder="Search members..."
                    searchValue={filters.search}
                    onSearch={handleSearch}
                    emptyIcon={Users}
                    emptyTitle="No players found"
                    emptyDescription="Add a player or adjust your filters."
                />
            </div>
        </>
    );
}

PlayersIndex.layout = {
    breadcrumbs: [{ title: 'Members', href: playersIndex() }],
};
