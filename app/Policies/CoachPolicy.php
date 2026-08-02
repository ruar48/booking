<?php

namespace App\Policies;

use App\Models\Coach;
use App\Models\User;
use App\Policies\Concerns\HandlesRoles;

class CoachPolicy
{
    use HandlesRoles;

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Coach $coach): bool
    {
        return $coach->is_active
            || $this->isClubAdmin($user, $coach->club_id)
            || $this->ownsRecord($user, $coach->user_id);
    }
}
