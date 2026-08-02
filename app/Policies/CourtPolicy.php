<?php

namespace App\Policies;

use App\Enums\Role;
use App\Models\Court;
use App\Models\User;
use App\Policies\Concerns\HandlesRoles;

class CourtPolicy
{
    use HandlesRoles;

    public function viewAny(User $user): bool
    {
        return $this->viewAnyAuthenticated($user);
    }

    public function view(User $user, Court $court): bool
    {
        return $this->isSuperAdmin($user)
            || $this->isClubAdmin($user, $court->club_id)
            || $this->belongsToClub($user, $court->club_id);
    }

    public function create(User $user): bool
    {
        return $this->isSuperAdmin($user) || $this->hasRole($user, Role::ClubAdmin);
    }

    public function update(User $user, Court $court): bool
    {
        return $this->isClubAdmin($user, $court->club_id);
    }

    public function delete(User $user, Court $court): bool
    {
        return $this->isClubAdmin($user, $court->club_id);
    }

    private function viewAnyAuthenticated(User $user): bool
    {
        return $this->isSuperAdmin($user)
            || $this->hasRole($user, Role::ClubAdmin)
            || $this->hasRole($user, Role::Player)
            || $this->hasRole($user, Role::Coach);
    }
}
