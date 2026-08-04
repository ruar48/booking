<?php

namespace App\Policies;

use App\Enums\Role;
use App\Models\Product;
use App\Models\User;
use App\Policies\Concerns\HandlesRoles;

class ProductPolicy
{
    use HandlesRoles;

    public function viewAny(User $user): bool
    {
        return $this->isSuperAdmin($user) || $this->hasRole($user, Role::ClubAdmin);
    }

    public function view(User $user, Product $product): bool
    {
        return $this->isSuperAdmin($user) || $this->isClubAdmin($user, $product->club_id);
    }

    public function create(User $user): bool
    {
        return $this->isSuperAdmin($user) || $this->hasRole($user, Role::ClubAdmin);
    }

    public function update(User $user, Product $product): bool
    {
        return $this->isClubAdmin($user, $product->club_id);
    }

    public function delete(User $user, Product $product): bool
    {
        return $this->isClubAdmin($user, $product->club_id);
    }

    public function adjustStock(User $user, Product $product): bool
    {
        return $this->isClubAdmin($user, $product->club_id);
    }
}
