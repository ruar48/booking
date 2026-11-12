<?php

namespace App\Policies;

use App\Enums\Role;
use App\Models\OpenPlaySession;
use App\Models\User;
use App\Policies\Concerns\HandlesRoles;

class OpenPlaySessionPolicy
{
    use HandlesRoles;

    public function viewAny(User $user): bool
    {
        return $this->isSuperAdmin($user) || $this->hasRole($user, Role::ClubAdmin);
    }

    public function view(User $user, OpenPlaySession $openPlaySession): bool
    {
        return $this->isClubAdmin($user);
    }

    public function create(User $user): bool
    {
        return $this->isSuperAdmin($user) || $this->hasRole($user, Role::ClubAdmin);
    }

    public function update(User $user, OpenPlaySession $openPlaySession): bool
    {
        return $this->isClubAdmin($user);
    }

    public function delete(User $user, OpenPlaySession $openPlaySession): bool
    {
        return $this->update($user, $openPlaySession);
    }

    /**
     * Stack or pull one's own paddle: only a player holding a paid spot in
     * the session. Staff manage everyone else's through update().
     */
    public function stackOwnPaddle(User $user, OpenPlaySession $openPlaySession): bool
    {
        return $openPlaySession->isPaddleStacking()
            && $openPlaySession->seatedPlayerIdFor($user) !== null;
    }
}
