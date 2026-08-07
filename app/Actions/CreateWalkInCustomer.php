<?php

namespace App\Actions;

use App\Enums\Role;
use App\Models\Player;
use App\Models\User;
use Illuminate\Support\Str;

class CreateWalkInCustomer
{
    /**
     * Create a real user account for a walk-in customer (name + phone, no email).
     */
    public function create(string $name, string $phone): User
    {
        $phone = trim(preg_replace('/[\s\-]+/', '', $phone) ?? $phone);

        $user = User::create([
            'name' => $name,
            'email' => 'walkin-'.Str::uuid()->toString().'@walkin.local',
            'phone' => $phone,
            'password' => Str::password(32),
        ]);

        $user->assignRole(Role::Player->value);

        Player::query()->create([
            'user_id' => $user->id,
            'phone' => $phone,
        ]);

        return $user;
    }
}
