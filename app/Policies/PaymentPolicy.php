<?php

namespace App\Policies;

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
        return $this->isSuperAdmin($user)
            || $this->ownsRecord($user, $payment->user_id);
    }

    public function markPaid(User $user, Payment $payment): bool
    {
        return $this->isSuperAdmin($user) || $this->hasRole($user, Role::ClubAdmin);
    }
}
