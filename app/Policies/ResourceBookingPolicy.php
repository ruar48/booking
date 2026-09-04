<?php

namespace App\Policies;

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Enums\Role;
use App\Models\ResourceBooking;
use App\Models\User;
use App\Policies\Concerns\HandlesRoles;
use Illuminate\Auth\Access\Response;

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

    public function cancel(User $user, ResourceBooking $resourceBooking): bool
    {
        if ($this->isClubAdmin($user)) {
            return true;
        }

        // A member may still drop their own booking while it is unpaid and
        // unconfirmed — that is abandoning checkout, not cancelling a
        // reservation the venue is holding for them. Once it is paid or
        // approved only staff can cancel, and the member reschedules instead.
        return $this->ownsRecord($user, $resourceBooking->user_id)
            && $resourceBooking->status === BookingStatus::Pending
            && $resourceBooking->payment_status === PaymentStatus::Unpaid;
    }

    /**
     * Returns a Response rather than a bool so every refusal carries its
     * reason. A denied reschedule is a dead end for the customer, and the
     * default "This action is unauthorized." tells them nothing about which
     * rule they hit. These messages are what the toast shows — see the
     * Inertia 403 handler in bootstrap/app.php.
     */
    public function reschedule(User $user, ResourceBooking $resourceBooking): Response
    {
        // A booking in a terminal state can't be moved by anyone, admins
        // included — there is no live slot left to move.
        if (! in_array($resourceBooking->status, [BookingStatus::Pending, BookingStatus::Approved], true)) {
            return Response::deny(__('This booking is :status and can no longer be rescheduled.', [
                'status' => $resourceBooking->status->value,
            ]));
        }

        if ($this->isClubAdmin($user)) {
            return Response::allow();
        }

        if (! $this->ownsRecord($user, $resourceBooking->user_id)) {
            return Response::deny();
        }

        // A booking that was itself created by a previous reschedule can't be
        // rescheduled again, to prevent endlessly shifting the same slot.
        if ($resourceBooking->rescheduled_from_id !== null) {
            return Response::deny(__('This booking has already been rescheduled once. Please contact the venue to move it again.'));
        }

        // Members must reschedule at least 2 full days before the booking
        // starts; after that the slot is locked in.
        return now()->addDays(2)->lte($resourceBooking->starts_at)
            ? Response::allow()
            : Response::deny(__('Bookings can only be rescheduled up to 2 days before the start time.'));
    }
}
