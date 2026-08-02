import { Head, router } from '@inertiajs/react';
import { type ColumnDef } from '@tanstack/react-table';
import { Shield } from 'lucide-react';

import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDateTime } from '@/lib/format';
import { index as auditLogsIndex } from '@/routes/admin/audit-logs';
import type { AuditLog, Paginated } from '@/types/booking';

type Props = {
    logs: Paginated<AuditLog>;
    filters: { action?: string; user_id?: string };
};

export default function AuditLogsIndex({ logs, filters }: Props) {
    const columns: ColumnDef<AuditLog>[] = [
        {
            accessorKey: 'created_at',
            header: 'Time',
            cell: ({ row }) => formatDateTime(row.original.created_at),
        },
        {
            accessorKey: 'user',
            header: 'User',
            cell: ({ row }) => row.original.user?.name ?? 'System',
        },
        {
            accessorKey: 'action',
            header: 'Action',
            cell: ({ row }) => (
                <Badge variant="outline">{row.original.action}</Badge>
            ),
        },
        {
            accessorKey: 'auditable_type',
            header: 'Resource',
            cell: ({ row }) =>
                row.original.auditable_type?.split('\\').pop() ?? '—',
        },
        {
            accessorKey: 'ip_address',
            header: 'IP',
            cell: ({ row }) => row.original.ip_address ?? '—',
        },
    ];

    return (
        <>
            <Head title="Audit Logs" />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <PageHeader
                    title="Audit logs"
                    description="Track administrative actions and changes"
                />

                <div className="flex flex-wrap gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="action">Action</Label>
                        <Input
                            id="action"
                            defaultValue={filters.action}
                            placeholder="e.g. created, updated"
                            className="w-[200px]"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    router.get(
                                        auditLogsIndex().url,
                                        {
                                            action: e.currentTarget.value || undefined,
                                            user_id: filters.user_id,
                                        },
                                        { preserveState: true },
                                    );
                                }
                            }}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="user_id">User ID</Label>
                        <Input
                            id="user_id"
                            type="number"
                            defaultValue={filters.user_id}
                            className="w-[140px]"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    router.get(
                                        auditLogsIndex().url,
                                        {
                                            action: filters.action,
                                            user_id:
                                                e.currentTarget.value || undefined,
                                        },
                                        { preserveState: true },
                                    );
                                }
                            }}
                        />
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={logs.data}
                    pagination={logs}
                    emptyIcon={Shield}
                    emptyTitle="No audit logs"
                    emptyDescription="Administrative actions will be logged here."
                />
            </div>
        </>
    );
}

AuditLogsIndex.layout = {
    breadcrumbs: [{ title: 'Audit Logs', href: auditLogsIndex() }],
};
