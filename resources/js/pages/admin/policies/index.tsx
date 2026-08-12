import { Head, Link, router } from '@inertiajs/react';
import { type ColumnDef } from '@tanstack/react-table';
import { AlertTriangle, FileText, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { formatDateTime } from '@/lib/format';
import { create, destroy, edit, index as policiesIndex } from '@/routes/admin/policies';
import type { Policy } from '@/types/booking';

type Props = {
    policies: Policy[];
};

const PLACEMENT_LABELS: Record<string, string> = {
    checkout: 'Booking checkout (payment step)',
    general: 'Not shown yet',
};

export default function AdminPoliciesIndex({ policies }: Props) {
    const [pendingDelete, setPendingDelete] = useState<Policy | null>(null);
    const [deleting, setDeleting] = useState(false);

    const confirmDelete = () => {
        if (!pendingDelete) return;
        setDeleting(true);
        router.delete(destroy(pendingDelete).url, {
            onSuccess: () => setPendingDelete(null),
            onFinish: () => setDeleting(false),
        });
    };

    const columns: ColumnDef<Policy>[] = [
        {
            accessorKey: 'title',
            header: 'Policy',
            cell: ({ row }) => (
                <Link href={edit(row.original)} className="font-medium hover:underline">
                    {row.original.title}
                </Link>
            ),
        },
        {
            accessorKey: 'placement',
            header: 'Shown at',
            cell: ({ row }) => (
                <Badge variant="outline">{PLACEMENT_LABELS[row.original.placement] ?? row.original.placement}</Badge>
            ),
        },
        {
            accessorKey: 'is_active',
            header: 'Status',
            cell: ({ row }) => <StatusBadge status={row.original.is_active ? 'active' : 'inactive'} />,
        },
        {
            accessorKey: 'version',
            header: 'Version',
            cell: ({ row }) => `v${row.original.version}`,
        },
        {
            accessorKey: 'updated_at',
            header: 'Last updated',
            cell: ({ row }) => (
                <div className="text-sm">
                    <div>{row.original.updated_at ? formatDateTime(row.original.updated_at) : '—'}</div>
                    {row.original.updatedBy ? (
                        <div className="text-muted-foreground text-xs">by {row.original.updatedBy.name}</div>
                    ) : null}
                </div>
            ),
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
                    <Button variant="ghost" size="icon" onClick={() => setPendingDelete(row.original)}>
                        <Trash2 className="text-destructive/80 size-4" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <>
            <Head title="Policies" />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <PageHeader
                    title="Policies & agreements"
                    description="Manage booking rules, payment terms, and agreements shown to players during checkout"
                    actions={
                        <Button asChild>
                            <Link href={create()}>
                                <Plus className="size-4" />
                                New policy
                            </Link>
                        </Button>
                    }
                />

                <DataTable
                    columns={columns}
                    data={policies}
                    emptyIcon={FileText}
                    emptyTitle="No policies configured"
                    emptyDescription="Create a policy to show players during checkout."
                />
            </div>

            <Dialog open={Boolean(pendingDelete)} onOpenChange={(open) => (deleting ? null : !open && setPendingDelete(null))}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader className="items-center text-center sm:items-center sm:text-center">
                        <div className="bg-destructive/10 text-destructive flex size-11 items-center justify-center rounded-full">
                            <AlertTriangle className="size-5.5" />
                        </div>
                        <DialogTitle>Delete this policy?</DialogTitle>
                        <DialogDescription>
                            "{pendingDelete?.title}" will no longer be shown to players. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="sm:justify-center">
                        <Button variant="outline" onClick={() => setPendingDelete(null)} disabled={deleting}>
                            Keep policy
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
                            {deleting ? 'Deleting…' : 'Yes, delete policy'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

AdminPoliciesIndex.layout = {
    breadcrumbs: [{ title: 'Policies', href: policiesIndex() }],
};
