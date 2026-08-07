<?php

namespace App\Policies;

use App\Enums\Role;
use App\Models\TrainingSession;
use App\Models\User;
use App\Policies\Concerns\HandlesRoles;

class TrainingSessionPolicy
{
    use HandlesRoles;

    public function viewAny(User $user): bool
    {
        return $this->isSuperAdmin($user)
            || $this->hasRole($user, Role::ClubAdmin)
            || $this->hasRole($user, Role::Coach)
            || $this->hasRole($user, Role::Player);
    }

    public function view(User $user, TrainingSession $trainingSession): bool
    {
        if ($this->isClubAdmin($user)) {
            return true;
        }

        if ($this->isCoach($user) && $trainingSession->coach?->user_id === $user->id) {
            return true;
        }

        if ($this->isPlayer($user)) {
            $playerIds = $user->players()->pluck('id');

            return $trainingSession->attendance()
                ->whereIn('player_id', $playerIds)
                ->exists();
        }

        return false;
    }

    public function create(User $user): bool
    {
        return $this->isSuperAdmin($user)
            || $this->hasRole($user, Role::ClubAdmin)
            || $this->hasRole($user, Role::Coach);
    }
}
