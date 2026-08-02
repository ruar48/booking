<?php

namespace App\Policies;

use App\Enums\BookingStatus;
use App\Enums\Role;
use App\Models\CourtBooking;
use App\Models\User;
use App\Policies\Concerns\HandlesRoles;

class CourtBookingPolicy
{
    use HandlesRoles;

    public function viewAny(User $user): bool
    {
        return $this->isSuperAdmin($user)
            || $this->hasRole($user, Role::ClubAdmin)
            || $this->hasRole($user, Role::Player);
    }

    public function view(User $user, CourtBooking $courtBooking): bool
    {
        $clubId = $courtBooking->court?->club_id;

        return $this->isClubAdmin($user, $clubId)
            || $this->ownsRecord($user, $courtBooking->user_id);
    }

    public function create(User $user): bool
    {
        return $this->hasRole($user, Role::Player)
            || $this->hasRole($user, Role::ClubAdmin)
            || $this->isSuperAdmin($user);
    }

    public function update(User $user, CourtBooking $courtBooking): bool
    {
        $clubId = $courtBooking->court?->club_id;

        if ($this->isClubAdmin($user, $clubId)) {
            return true;
        }

        return $this->ownsRecord($user, $courtBooking->user_id)
            && $courtBooking->status === BookingStatus::Pending;
    }

    public function delete(User $user, CourtBooking $courtBooking): bool
    {
        return $this->update($user, $courtBooking);
    }

    public function markPaid(User $user, CourtBooking $courtBooking): bool
    {
        return $this->isClubAdmin($user, $courtBooking->court?->club_id);
    }

    public function cancel(User $user, CourtBooking $courtBooking): bool
    {
        if ($this->isClubAdmin($user, $courtBooking->court?->club_id)) {
            return true;
        }

        return $this->ownsRecord($user, $courtBooking->user_id)
            && in_array($courtBooking->status, [BookingStatus::Pending, BookingStatus::Approved], true);
    }
}
