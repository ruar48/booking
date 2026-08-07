<?php

namespace App\Policies;

use App\Enums\Role;
use App\Models\Sale;
use App\Models\User;
use App\Policies\Concerns\HandlesRoles;

class SalePolicy
{
    use HandlesRoles;

    public function viewAny(User $user): bool
    {
        return $this->isSuperAdmin($user) || $this->hasRole($user, Role::ClubAdmin);
    }

    public function view(User $user, Sale $sale): bool
    {
        return $this->isSuperAdmin($user) || $this->isClubAdmin($user);
    }

    public function create(User $user): bool
    {
        return $this->isSuperAdmin($user) || $this->hasRole($user, Role::ClubAdmin);
    }

    public function void(User $user, Sale $sale): bool
    {
        return $this->isClubAdmin($user);
    }
}
