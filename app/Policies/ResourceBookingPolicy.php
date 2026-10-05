<?php

namespace App\Policies;

use App\Enums\BookingStatus;
use App\Enums\Role;
use App\Models\ResourceBooking;
use App\Models\User;
use App\Policies\Concerns\HandlesRoles;

class ResourceBookingPolicy
{
    use HandlesRoles;

    public function viewAny(User $user): bool
    {
        return $this->isSuperAdmin($user)
            || $this->hasRole($user, Role::ClubAdmin)
            || $this->hasRole($user, Role::Player);
    }

    public function view(User $user, ResourceBooking $resourceBooking): bool
    {
        return $this->isClubAdmin($user)
            || $this->ownsRecord($user, $resourceBooking->user_id);
    }

    public function create(User $user): bool
    {
        return $this->hasRole($user, Role::Player)
            || $this->hasRole($user, Role::ClubAdmin)
            || $this->isSuperAdmin($user);
    }

    public function createForOther(User $user): bool
    {
        return $this->isClubAdmin($user);
    }

    public function update(User $user, ResourceBooking $resourceBooking): bool
    {
        if ($this->isClubAdmin($user)) {
            return true;
        }

        return $this->ownsRecord($user, $resourceBooking->user_id)
            && $resourceBooking->status === BookingStatus::Pending;
    }

    public function delete(User $user, ResourceBooking $resourceBooking): bool
    {
        return $this->update($user, $resourceBooking);
    }

    public function markPaid(User $user, ResourceBooking $resourceBooking): bool
    {
        return $this->isClubAdmin($user);
    }

    // There is deliberately no cancel or reschedule ability: under the venue's
    // Payment and Booking Policy a booking is final once made. Unpaid ones are
    // released by bookings:cancel-unpaid, not by a person.
}
