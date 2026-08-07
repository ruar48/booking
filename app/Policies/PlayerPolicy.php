<?php

namespace App\Policies;

use App\Enums\Role;
use App\Models\Player;
use App\Models\User;
use App\Policies\Concerns\HandlesRoles;

class PlayerPolicy
{
    use HandlesRoles;

    public function viewAny(User $user): bool
    {
        return $this->isSuperAdmin($user)
            || $this->hasRole($user, Role::ClubAdmin)
            || $this->hasRole($user, Role::Coach)
            || $this->hasRole($user, Role::Player);
    }

    public function view(User $user, Player $player): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        if ($this->isClubAdmin($user)) {
            return true;
        }

        if ($this->ownsRecord($user, $player->user_id)) {
            return true;
        }

        return $this->isCoach($user);
    }

    public function create(User $user): bool
    {
        return $this->isSuperAdmin($user) || $this->hasRole($user, Role::ClubAdmin);
    }

    public function update(User $user, Player $player): bool
    {
        return $this->isClubAdmin($user)
            || $this->ownsRecord($user, $player->user_id);
    }

    public function delete(User $user, Player $player): bool
    {
        return $this->isClubAdmin($user);
    }
}
