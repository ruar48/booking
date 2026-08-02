<?php

namespace App\Policies;

use App\Enums\Role;
use App\Models\Tournament;
use App\Models\User;
use App\Policies\Concerns\HandlesRoles;

class TournamentPolicy
{
    use HandlesRoles;

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Tournament $tournament): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $this->isSuperAdmin($user)
            || $this->hasRole($user, Role::ClubAdmin)
            || $this->isTournamentOrganizer($user);
    }

    public function update(User $user, Tournament $tournament): bool
    {
        return $this->isClubAdmin($user, $tournament->club_id)
            || $this->isTournamentOrganizer($user)
            || $this->ownsRecord($user, $tournament->created_by);
    }

    public function delete(User $user, Tournament $tournament): bool
    {
        return $this->isClubAdmin($user, $tournament->club_id)
            || $this->isSuperAdmin($user);
    }

    public function register(User $user, Tournament $tournament): bool
    {
        return $this->hasRole($user, Role::Player)
            && $user->players()->exists();
    }

    public function generateBracket(User $user, Tournament $tournament): bool
    {
        return $this->isClubAdmin($user, $tournament->club_id)
            || $this->isTournamentOrganizer($user);
    }
}
