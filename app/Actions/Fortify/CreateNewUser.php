<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Enums\Role;
use App\Models\Club;
use App\Models\Player;
use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        Validator::make($input, [
            ...$this->profileRules(),
            'password' => $this->passwordRules(),
        ])->validate();

        $user = User::create([
            'name' => $input['name'],
            'email' => $input['email'],
            'password' => $input['password'],
        ]);

        $user->assignRole(Role::Player->value);

        $club = Club::query()->where('is_active', true)->oldest()->first();

        if ($club !== null) {
            $club->users()->attach($user->id, [
                'membership_status' => 'active',
                'joined_at' => now()->toDateString(),
            ]);

            Player::query()->create([
                'user_id' => $user->id,
                'club_id' => $club->id,
            ]);
        }

        return $user;
    }
}
