<?php

namespace App\Policies;

use App\Models\User;
use App\Policies\Concerns\HandlesRoles;

class PageViewPolicy
{
    use HandlesRoles;

    public function viewAny(User $user): bool
    {
        return $this->isClubAdmin($user);
    }
}
