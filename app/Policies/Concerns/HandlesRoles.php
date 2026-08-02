<?php

namespace App\Policies\Concerns;

use App\Enums\Role;
use App\Models\User;

trait HandlesRoles
{
    protected function isSuperAdmin(?User $user): bool
    {
        return $user?->hasRole(Role::SuperAdmin->value) ?? false;
    }

    protected function hasRole(?User $user, Role $role): bool
    {
        return $user?->hasRole($role->value) ?? false;
    }

    protected function belongsToClub(?User $user, ?int $clubId): bool
    {
        if ($user === null || $clubId === null) {
            return false;
        }

        return $user->clubs()->where('clubs.id', $clubId)->exists();
    }

    protected function isClubAdmin(?User $user, ?int $clubId = null): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        if (! $this->hasRole($user, Role::ClubAdmin)) {
            return false;
        }

        return $clubId === null || $this->belongsToClub($user, $clubId);
    }

    protected function isTournamentOrganizer(?User $user): bool
    {
        return $this->isSuperAdmin($user) || $this->hasRole($user, Role::TournamentOrganizer);
    }

    protected function isCoach(?User $user): bool
    {
        return $this->hasRole($user, Role::Coach);
    }

    protected function isPlayer(?User $user): bool
    {
        return $this->hasRole($user, Role::Player);
    }

    protected function ownsRecord(?User $user, ?int $ownerUserId): bool
    {
        return $user !== null && $user->id === $ownerUserId;
    }
}
