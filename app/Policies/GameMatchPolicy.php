<?php

namespace App\Policies;

use App\Models\GameMatch;
use App\Models\User;
use App\Policies\Concerns\HandlesRoles;

class GameMatchPolicy
{
    use HandlesRoles;

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, GameMatch $gameMatch): bool
    {
        return true;
    }

    public function updateScore(User $user, GameMatch $gameMatch): bool
    {
        $clubId = $gameMatch->court?->club_id;

        return $this->isClubAdmin($user, $clubId)
            || $this->isTournamentOrganizer($user)
            || $this->ownsRecord($user, $gameMatch->referee_id);
    }

    public function complete(User $user, GameMatch $gameMatch): bool
    {
        return $this->updateScore($user, $gameMatch);
    }
}
