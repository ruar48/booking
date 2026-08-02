<?php

namespace App\Policies;

use App\Enums\Role;
use App\Models\Announcement;
use App\Models\User;
use App\Policies\Concerns\HandlesRoles;

class AnnouncementPolicy
{
    use HandlesRoles;

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Announcement $announcement): bool
    {
        return $announcement->is_published
            || $this->isClubAdmin($user, $announcement->club_id)
            || $this->ownsRecord($user, $announcement->created_by);
    }

    public function create(User $user): bool
    {
        return $this->isSuperAdmin($user) || $this->hasRole($user, Role::ClubAdmin);
    }

    public function update(User $user, Announcement $announcement): bool
    {
        return $this->isClubAdmin($user, $announcement->club_id)
            || $this->ownsRecord($user, $announcement->created_by);
    }

    public function delete(User $user, Announcement $announcement): bool
    {
        return $this->update($user, $announcement);
    }
}
