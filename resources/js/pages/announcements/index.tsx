import { Head, Link } from '@inertiajs/react';
import { type ColumnDef } from '@tanstack/react-table';
import { Megaphone, Pencil, Plus } from 'lucide-react';

import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { formatDate, formatRelative } from '@/lib/format';
import { create, edit, index as announcementsIndex } from '@/routes/announcements';
import type { Announcement, Paginated } from '@/types/booking';

type Props = {
    announcements: Paginated<Announcement>;
};

export default function AnnouncementsIndex({ announcements }: Props) {
    const columns: ColumnDef<Announcement>[] = [
        {
            accessorKey: 'title',
            header: 'Title',
            cell: ({ row }) => (
                <Link
                    href={edit(row.original)}
                    className="font-medium hover:underline"
                >
                    {row.original.title}
                </Link>
            ),
        },
        {
            accessorKey: 'is_published',
            header: 'Status',
            cell: ({ row }) => (
                <StatusBadge
                    status={row.original.is_published ? 'active' : 'draft'}
                />
            ),
        },
        {
            accessorKey: 'published_at',
            header: 'Published',
            cell: ({ row }) =>
                row.original.published_at
                    ? formatRelative(row.original.published_at)
                    : '—',
        },
        {
            accessorKey: 'created_at',
            header: 'Created',
            cell: ({ row }) => formatDate(row.original.created_at),
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
            <Head title="Announcements" />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <PageHeader
                    title="Announcements"
                    description="Publish news and updates for members"
                    actions={
                        <Button asChild>
                            <Link href={create()}>
                                <Plus className="size-4" />
                                New announcement
                            </Link>
                        </Button>
                    }
                />
                <DataTable
                    columns={columns}
                    data={announcements.data}
                    pagination={announcements}
                    emptyIcon={Megaphone}
                    emptyTitle="No announcements"
                    emptyDescription="Create an announcement to share with members."
                />
            </div>
        </>
    );
}

AnnouncementsIndex.layout = {
    breadcrumbs: [{ title: 'Announcements', href: announcementsIndex() }],
};
