<?php

namespace Database\Seeders;

use App\Enums\Role as RoleEnum;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    /**
     * @var array<string, list<string>>
     */
    private const RESOURCE_ACTIONS = [
        'clubs' => ['view', 'create', 'update', 'delete'],
        'players' => ['view', 'create', 'update', 'delete'],
        'resources' => ['view', 'create', 'update', 'delete'],
        'bookings' => ['view', 'create', 'update', 'delete', 'approve'],
        'tournaments' => ['view', 'create', 'update', 'delete'],
        'matches' => ['view', 'create', 'update', 'delete'],
        'announcements' => ['view', 'create', 'update', 'delete'],
        'coaches' => ['view', 'create', 'update', 'delete'],
        'training' => ['view', 'create', 'update', 'delete'],
        'payments' => ['view', 'create', 'update', 'delete', 'refund'],
        'inventory' => ['view', 'create', 'update', 'delete', 'adjust'],
        'pos' => ['view', 'create', 'void', 'reports'],
        'reports' => ['view', 'export'],
        'settings' => ['view', 'update'],
        'audit_logs' => ['view'],
    ];

    /**
     * @var array<string, list<string>>
     */
    private const ROLE_PERMISSIONS = [
        RoleEnum::SuperAdmin->value => ['*'],
        RoleEnum::ClubAdmin->value => [
            'clubs.view', 'clubs.update',
            'players.*',
            'resources.*',
            'bookings.*',
            'tournaments.*',
            'matches.*',
            'announcements.*',
            'coaches.*',
            'training.*',
            'payments.view', 'payments.create', 'payments.update', 'payments.refund',
            'inventory.*',
            'pos.*',
            'reports.view', 'reports.export',
            'settings.view', 'settings.update',
            'audit_logs.view',
        ],
        RoleEnum::TournamentOrganizer->value => [
            'clubs.view',
            'players.view',
            'resources.view',
            'bookings.view',
            'tournaments.*',
            'matches.*',
            'announcements.view', 'announcements.create', 'announcements.update',
            'coaches.view',
            'training.view',
            'payments.view',
            'reports.view', 'reports.export',
        ],
        RoleEnum::Coach->value => [
            'clubs.view',
            'players.view',
            'resources.view',
            'bookings.view', 'bookings.create',
            'tournaments.view',
            'matches.view',
            'announcements.view',
            'coaches.view',
            'training.view', 'training.create', 'training.update',
            'payments.view',
            'reports.view',
        ],
        RoleEnum::Player->value => [
            'clubs.view',
            'players.view',
            'resources.view',
            'bookings.view', 'bookings.create', 'bookings.update', 'bookings.delete',
            'tournaments.view',
            'matches.view',
            'announcements.view',
            'coaches.view',
            'training.view',
            'payments.view',
        ],
    ];

    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = $this->createPermissions();

        foreach (RoleEnum::cases() as $roleEnum) {
            $role = Role::firstOrCreate(
                ['name' => $roleEnum->value, 'guard_name' => 'web'],
            );

            $role->syncPermissions(
                $this->resolvePermissions(self::ROLE_PERMISSIONS[$roleEnum->value], $permissions),
            );
        }
    }

    /**
     * @return list<string>
     */
    private function createPermissions(): array
    {
        $permissions = [];

        foreach (self::RESOURCE_ACTIONS as $resource => $actions) {
            foreach ($actions as $action) {
                $name = "{$resource}.{$action}";
                Permission::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
                $permissions[] = $name;
            }
        }

        return $permissions;
    }

    /**
     * @param  list<string>  $patterns
     * @param  list<string>  $allPermissions
     * @return list<string>
     */
    private function resolvePermissions(array $patterns, array $allPermissions): array
    {
        if (in_array('*', $patterns, true)) {
            return $allPermissions;
        }

        $resolved = [];

        foreach ($patterns as $pattern) {
            if (str_ends_with($pattern, '.*')) {
                $prefix = substr($pattern, 0, -1);

                foreach ($allPermissions as $permission) {
                    if (str_starts_with($permission, $prefix)) {
                        $resolved[] = $permission;
                    }
                }

                continue;
            }

            $resolved[] = $pattern;
        }

        return array_values(array_unique($resolved));
    }
}
