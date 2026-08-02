<?php

namespace App\Policies;

use App\Enums\Role;
use App\Models\ClubEvent;
use App\Models\User;
use App\Policies\Concerns\HandlesRoles;

class ClubEventPolicy
{
    use HandlesRoles;

    public function viewAny(User $user): bool
    {
        return $this->isSuperAdmin($user) || $this->hasRole($user, Role::ClubAdmin);
    }

    public function view(User $user, ClubEvent $clubEvent): bool
    {
        return $this->isClubAdmin($user, $clubEvent->club_id);
    }

    public function create(User $user): bool
    {
        return $this->isSuperAdmin($user) || $this->hasRole($user, Role::ClubAdmin);
    }

    public function update(User $user, ClubEvent $clubEvent): bool
    {
        return $this->isClubAdmin($user, $clubEvent->club_id);
    }

    public function delete(User $user, ClubEvent $clubEvent): bool
    {
        return $this->update($user, $clubEvent);
    }
}
