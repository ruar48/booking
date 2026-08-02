<?php

namespace App\Concerns;

use App\Enums\CourtStatus;
use App\Models\Club;
use App\Models\Court;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rule;

trait CourtValidationRules
{
    /**
     * @return array<string, array<int, ValidationRule|array<mixed>|string>>
     */
    protected function courtRules(?int $courtId = null): array
    {
        $clubId = $courtId
            ? Court::query()->whereKey($courtId)->value('club_id')
            : null;

        return [
            'club_id' => ['required', 'integer', Rule::exists(Club::class, 'id')],
            'name' => ['required', 'string', 'max:255'],
            'court_number' => [
                'required',
                'string',
                'max:50',
                Rule::unique(Court::class, 'court_number')
                    ->where('club_id', $clubId ?? request()->input('club_id'))
                    ->ignore($courtId),
            ],
            'surface_type' => ['required', 'string', Rule::in(['hard', 'clay', 'grass', 'carpet', 'synthetic'])],
            'location_type' => ['required', 'string', Rule::in(['indoor', 'outdoor'])],
            'has_lighting' => ['sometimes', 'boolean'],
            'hourly_rate' => ['required', 'numeric', 'min:0'],
            'status' => ['sometimes', 'string', Rule::enum(CourtStatus::class)],
            'photos' => ['nullable', 'array'],
            'photos.*' => ['string', 'max:255'],
            'description' => ['nullable', 'string'],
        ];
    }
}
