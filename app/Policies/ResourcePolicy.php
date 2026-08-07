<?php

namespace App\Policies;

use App\Enums\Role;
use App\Models\Resource;
use App\Models\User;
use App\Policies\Concerns\HandlesRoles;

class ResourcePolicy
{
    use HandlesRoles;

    public function viewAny(User $user): bool
    {
        return $this->viewAnyAuthenticated($user);
    }

    public function view(User $user, Resource $resource): bool
    {
        return $this->viewAnyAuthenticated($user);
    }

    public function create(User $user): bool
    {
        return $this->isSuperAdmin($user) || $this->hasRole($user, Role::ClubAdmin);
    }

    public function update(User $user, Resource $resource): bool
    {
        return $this->isClubAdmin($user);
    }

    public function delete(User $user, Resource $resource): bool
    {
        return $this->isClubAdmin($user);
    }

    private function viewAnyAuthenticated(User $user): bool
    {
        return $this->isSuperAdmin($user)
            || $this->hasRole($user, Role::ClubAdmin)
            || $this->hasRole($user, Role::Player)
            || $this->hasRole($user, Role::Coach);
    }
}
