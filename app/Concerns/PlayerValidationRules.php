<?php

namespace App\Concerns;

use App\Models\Player;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rule;

trait PlayerValidationRules
{
    /**
     * @return array<string, array<int, ValidationRule|array<mixed>|string>>
     */
    protected function playerRules(?int $playerId = null): array
    {
        $userId = $playerId
            ? Player::query()->whereKey($playerId)->value('user_id')
            : null;

        return [
            'user_id' => [
                'required',
                'integer',
                Rule::exists(User::class, 'id'),
                Rule::unique(Player::class, 'user_id')->ignore($playerId),
            ],
            'skill_rating' => ['sometimes', 'integer', 'min:0', 'max:3000'],
            'experience_level' => ['required', 'string', Rule::in(['beginner', 'intermediate', 'advanced', 'professional'])],
            'playing_hand' => ['nullable', 'string', Rule::in(['left', 'right', 'ambidextrous'])],
            'gender' => ['nullable', 'string', Rule::in(['male', 'female', 'other', 'prefer_not_to_say'])],
            'birthdate' => ['nullable', 'date', 'before:today'],
            'phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:500'],
            'emergency_contact_name' => ['nullable', 'string', 'max:255'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:50'],
            'bio' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
