<?php

namespace App\Policies;

use App\Models\MessengerConversation;
use App\Models\User;
use App\Policies\Concerns\HandlesRoles;

/**
 * The Page inbox holds every customer's private chat with the venue, so only
 * venue admins may open or answer it.
 */
class MessengerConversationPolicy
{
    use HandlesRoles;

    public function viewAny(User $user): bool
    {
        return $this->isClubAdmin($user);
    }

    public function view(User $user, MessengerConversation $conversation): bool
    {
        return $this->isClubAdmin($user);
    }

    public function reply(User $user, MessengerConversation $conversation): bool
    {
        return $this->isClubAdmin($user);
    }
}
