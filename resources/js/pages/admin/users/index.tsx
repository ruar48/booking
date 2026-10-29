import { Head, router, usePage } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { UserCog } from 'lucide-react';
import { useCallback } from 'react';

import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDateTime } from '@/lib/format';
import { index as usersIndex, updateRole } from '@/routes/admin/users';
import type { Paginated } from '@/types/booking';

type RoleOption = { value: string; label: string };

type ManagedUser = {
    id: number;
    name: string;
    email: string;
    role: string | null;
    last_login_at: string | null;
    created_at: string;
};

type Props = {
    users: Paginated<ManagedUser>;
    roles: RoleOption[];
    filters: { search?: string; role?: string };
};

export default function UsersIndex({ users, roles, filters }: Props) {
    const { auth } = usePage().props;

    const handleSearch = useCallback(
        (value: string) => {
            router.get(
                usersIndex().url,
                { ...filters, search: value || undefined },
                { preserveState: true, replace: true },
            );
        },
        [filters],
    );

    const changeRole = (user: ManagedUser, role: string) => {
        router.patch(updateRole(user).url, { role }, { preserveScroll: true });
    };

    const columns: ColumnDef<ManagedUser>[] = [
        {
            accessorKey: 'name',
            header: 'Name',
            cell: ({ row }) => (
                <div>
                    <div className="font-medium">{row.original.name}</div>
                    <div className="text-sm text-muted-foreground">{row.original.email}</div>
                </div>
            ),
        },
        {
            accessorKey: 'role',
            header: 'Role',
            cell: ({ row }) => {
                const user = row.original;

                // Your own role is locked so the venue can't lose its last super admin.
                if (user.id === auth.user?.id) {
                    return (
                        <Badge variant="outline">
                            {roles.find((r) => r.value === user.role)?.label ?? 'No role'} (you)
                        </Badge>
                    );
                }

                return (
                    <Select value={user.role ?? undefined} onValueChange={(role) => changeRole(user, role)}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="No role" />
                        </SelectTrigger>
                        <SelectContent>
                            {roles.map((role) => (
                                <SelectItem key={role.value} value={role.value}>
                                    {role.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );
            },
        },
        {
            accessorKey: 'last_login_at',
            header: 'Last login',
            cell: ({ row }) => (row.original.last_login_at ? formatDateTime(row.original.last_login_at) : 'Never'),
        },
    ];

    return (
        <>
            <Head title="Users & Roles" />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <PageHeader
                    title="Users & roles"
                    description="Choose who can manage the venue. Super Admins and Club Admins get the admin dashboard."
                />

                <div className="w-full sm:w-[200px]">
                    <Select
                        value={filters.role ?? 'all'}
                        onValueChange={(role) =>
                            router.get(
                                usersIndex().url,
                                { ...filters, role: role === 'all' ? undefined : role },
                                { preserveState: true, replace: true },
                            )
                        }
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="All roles" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All roles</SelectItem>
                            {roles.map((role) => (
                                <SelectItem key={role.value} value={role.value}>
                                    {role.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <DataTable
                    columns={columns}
                    data={users.data}
                    pagination={users}
                    searchPlaceholder="Search by name or email..."
                    searchValue={filters.search}
                    onSearch={handleSearch}
                    emptyIcon={UserCog}
                    emptyTitle="No users found"
                    emptyDescription="Try a different search or role filter."
                />
            </div>
        </>
    );
}

UsersIndex.layout = {
    breadcrumbs: [{ title: 'Users & Roles', href: usersIndex() }],
};
