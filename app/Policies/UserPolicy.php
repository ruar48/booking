<?php

namespace App\Policies;

use App\Models\User;
use App\Policies\Concerns\HandlesRoles;
use Illuminate\Auth\Access\Response;

class UserPolicy
{
    use HandlesRoles;

    public function viewAny(User $user): bool
    {
        return $this->isSuperAdmin($user);
    }

    public function updateRole(User $user, User $target): Response
    {
        if (! $this->isSuperAdmin($user)) {
            return Response::deny();
        }

        // Changing your own role is the one way the venue can end up with no
        // super admin left to undo it.
        if ($user->is($target)) {
            return Response::deny(__('You cannot change your own role.'));
        }

        return Response::allow();
    }
}
