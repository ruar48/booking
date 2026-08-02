<?php

namespace App\Policies;

use App\Enums\Role;
use App\Models\Club;
use App\Models\User;
use App\Policies\Concerns\HandlesRoles;

class ClubPolicy
{
    use HandlesRoles;

    public function viewAny(User $user): bool
    {
        return $this->isSuperAdmin($user)
            || $this->hasRole($user, Role::ClubAdmin)
            || $this->hasRole($user, Role::Player)
            || $this->hasRole($user, Role::Coach);
    }

    public function view(User $user, Club $club): bool
    {
        return $this->isSuperAdmin($user)
            || $this->isClubAdmin($user, $club->id)
            || $this->belongsToClub($user, $club->id);
    }

    public function create(User $user): bool
    {
        return $this->isSuperAdmin($user);
    }

    public function update(User $user, Club $club): bool
    {
        return $this->isClubAdmin($user, $club->id);
    }

    public function delete(User $user, Club $club): bool
    {
        return $this->isSuperAdmin($user);
    }
}
