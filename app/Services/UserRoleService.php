<?php

namespace App\Services;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

/**
 * Who holds which role. Each account carries exactly one role, so changing it
 * replaces whatever it had (signup gives everyone Player).
 */
class UserRoleService
{
    public function __construct(
        private readonly AuditLogService $auditLog,
    ) {}

    public function paginate(?string $search, ?Role $role): LengthAwarePaginator
    {
        return User::query()
            ->with('roles:id,name')
            ->when($search, fn ($query) => $query->where(
                fn ($query) => $query
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%"),
            ))
            ->when($role, fn ($query) => $query->role($role->value))
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->roles->first()?->name,
                'last_login_at' => $user->last_login_at,
                'created_at' => $user->created_at,
            ]);
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    public function roleOptions(): array
    {
        return array_map(
            fn (Role $role) => ['value' => $role->value, 'label' => $role->label()],
            Role::cases(),
        );
    }

    public function changeRole(User $user, Role $role): void
    {
        $previous = $user->getRoleNames()->values()->all();

        DB::transaction(function () use ($user, $role, $previous) {
            $user->syncRoles([$role->value]);

            $this->auditLog->log('role_changed', $user, ['roles' => $previous], ['roles' => [$role->value]]);
        });
    }
}
