<?php

use App\Enums\Role as RoleEnum;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

function roleUser(RoleEnum $role): User
{
    Role::findOrCreate($role->value, 'web');

    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole($role->value);

    return $user;
}

beforeEach(function () {
    foreach (RoleEnum::cases() as $role) {
        Role::findOrCreate($role->value, 'web');
    }
});

it('lists users with their role for a super admin', function () {
    $admin = roleUser(RoleEnum::SuperAdmin);
    $member = roleUser(RoleEnum::Player);

    $this->withoutVite()
        ->actingAs($admin)
        ->get(route('admin.users.index', ['role' => RoleEnum::Player->value]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/users/index')
            ->has('users.data', 1)
            ->where('users.data.0.email', $member->email)
            ->where('users.data.0.role', RoleEnum::Player->value)
            ->has('roles', count(RoleEnum::cases())));
});

it('lets a super admin promote a member to admin', function () {
    $admin = roleUser(RoleEnum::SuperAdmin);
    $member = roleUser(RoleEnum::Player);

    $this->actingAs($admin)
        ->patch(route('admin.users.update-role', $member), ['role' => RoleEnum::ClubAdmin->value])
        ->assertRedirect();

    $member->refresh();

    expect($member->getRoleNames()->all())->toBe([RoleEnum::ClubAdmin->value])
        ->and($member->isVenueAdmin())->toBeTrue()
        ->and(AuditLog::query()->where('action', 'role_changed')->where('auditable_id', $member->id)->exists())->toBeTrue();
});

it('keeps club admins out of role management', function () {
    $clubAdmin = roleUser(RoleEnum::ClubAdmin);
    $member = roleUser(RoleEnum::Player);

    $this->actingAs($clubAdmin)->get(route('admin.users.index'))->assertForbidden();

    $this->actingAs($clubAdmin)
        ->patch(route('admin.users.update-role', $member), ['role' => RoleEnum::SuperAdmin->value])
        ->assertForbidden();

    expect($member->fresh()->hasRole(RoleEnum::Player->value))->toBeTrue();
});

it('stops a super admin from changing their own role', function () {
    $admin = roleUser(RoleEnum::SuperAdmin);

    $this->actingAs($admin)
        ->patch(route('admin.users.update-role', $admin), ['role' => RoleEnum::Player->value])
        ->assertForbidden();

    expect($admin->fresh()->hasRole(RoleEnum::SuperAdmin->value))->toBeTrue();
});

it('rejects an unknown role', function () {
    $admin = roleUser(RoleEnum::SuperAdmin);
    $member = roleUser(RoleEnum::Player);

    $this->actingAs($admin)
        ->patch(route('admin.users.update-role', $member), ['role' => 'owner'])
        ->assertSessionHasErrors('role');
});
