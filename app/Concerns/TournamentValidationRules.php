<?php

namespace App\Concerns;

use App\Enums\TournamentFormat;
use App\Enums\TournamentStatus;
use App\Models\Club;
use App\Models\Tournament;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rule;

trait TournamentValidationRules
{
    /**
     * @return array<string, array<int, ValidationRule|array<mixed>|string>>
     */
    protected function tournamentRules(?int $tournamentId = null): array
    {
        return [
            'club_id' => ['required', 'integer', Rule::exists(Club::class, 'id')],
            'name' => ['required', 'string', 'max:255'],
            'slug' => [
                'required',
                'string',
                'max:255',
                Rule::unique(Tournament::class)->ignore($tournamentId),
            ],
            'description' => ['nullable', 'string'],
            'poster' => ['nullable', 'string', 'max:255'],
            'entry_fee' => ['required', 'numeric', 'min:0'],
            'max_players' => ['required', 'integer', 'min:2', 'max:256'],
            'format' => ['required', 'string', Rule::enum(TournamentFormat::class)],
            'status' => ['sometimes', 'string', Rule::enum(TournamentStatus::class)],
            'registration_opens_at' => ['nullable', 'date'],
            'registration_closes_at' => ['nullable', 'date', 'after_or_equal:registration_opens_at'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
        ];
    }
}
