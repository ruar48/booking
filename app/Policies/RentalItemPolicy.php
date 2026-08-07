<?php

namespace App\Policies;

use App\Enums\Role;
use App\Models\RentalItem;
use App\Models\User;
use App\Policies\Concerns\HandlesRoles;

class RentalItemPolicy
{
    use HandlesRoles;

    public function viewAny(User $user): bool
    {
        return $this->isSuperAdmin($user) || $this->hasRole($user, Role::ClubAdmin);
    }

    public function view(User $user, RentalItem $rentalItem): bool
    {
        return $this->isSuperAdmin($user) || $this->isClubAdmin($user);
    }

    public function create(User $user): bool
    {
        return $this->isSuperAdmin($user) || $this->hasRole($user, Role::ClubAdmin);
    }

    public function update(User $user, RentalItem $rentalItem): bool
    {
        return $this->isClubAdmin($user);
    }

    public function delete(User $user, RentalItem $rentalItem): bool
    {
        return $this->isClubAdmin($user);
    }

    public function adjustStock(User $user, RentalItem $rentalItem): bool
    {
        return $this->isClubAdmin($user);
    }
}
