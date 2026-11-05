<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Enums\Role;
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
            'terms' => ['accepted'],
        ], [
            'terms.accepted' => __('Please agree to the Terms of Service and Privacy Notice to create an account.'),
        ])->validate();

        $user = User::create([
            'name' => $input['name'],
            'email' => $input['email'],
            'password' => $input['password'],
            // Proof of what was agreed to, and to which versions.
            'terms_accepted_at' => now(),
            'terms_version' => config('legal.terms.version'),
            'privacy_version' => config('legal.privacy.version'),
        ]);

        $user->assignRole(Role::Player->value);

        Player::query()->create([
            'user_id' => $user->id,
        ]);

        return $user;
    }
}
