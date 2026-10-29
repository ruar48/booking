<?php

namespace App\Policies;

use App\Enums\PaymentStatus;
use App\Enums\Role;
use App\Models\Payment;
use App\Models\User;
use App\Policies\Concerns\HandlesRoles;

class PaymentPolicy
{
    use HandlesRoles;

    public function viewAny(User $user): bool
    {
        return $this->isSuperAdmin($user) || $this->hasRole($user, Role::ClubAdmin);
    }

    public function view(User $user, Payment $payment): bool
    {
        // Club admins list every payment (viewAny), so they must be able to
        // open one too — otherwise "Mark as paid" and refunds are unreachable.
        return $this->viewAny($user)
            || $this->ownsRecord($user, $payment->user_id);
    }

    public function markPaid(User $user, Payment $payment): bool
    {
        return $this->isSuperAdmin($user) || $this->hasRole($user, Role::ClubAdmin);
    }

    /**
     * Only payments the system flagged (duplicate, late, or mismatched) can
     * be recorded as refunded — bookings are otherwise final.
     */
    public function markRefunded(User $user, Payment $payment): bool
    {
        return $this->markPaid($user, $payment)
            && $payment->flagged_at !== null
            && $payment->status !== PaymentStatus::Refunded;
    }
}
