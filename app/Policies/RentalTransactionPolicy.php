<?php

namespace App\Policies;

use App\Enums\Role;
use App\Models\RentalTransaction;
use App\Models\User;
use App\Policies\Concerns\HandlesRoles;

class RentalTransactionPolicy
{
    use HandlesRoles;

    public function viewAny(User $user): bool
    {
        return $this->isSuperAdmin($user) || $this->hasRole($user, Role::ClubAdmin);
    }

    public function view(User $user, RentalTransaction $rentalTransaction): bool
    {
        return $this->isSuperAdmin($user) || $this->isClubAdmin($user);
    }

    public function create(User $user): bool
    {
        return $this->isSuperAdmin($user) || $this->hasRole($user, Role::ClubAdmin);
    }

    public function return(User $user, RentalTransaction $rentalTransaction): bool
    {
        return $this->isClubAdmin($user);
    }

    public function approve(User $user, RentalTransaction $rentalTransaction): bool
    {
        return $this->isClubAdmin($user);
    }
}
