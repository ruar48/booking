<?php

namespace App\Concerns;

use App\Enums\ResourceStatus;
use App\Enums\Sport;
use App\Models\Club;
use App\Models\Resource;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rule;

trait ResourceValidationRules
{
    /**
     * @return array<string, array<int, ValidationRule|array<mixed>|string>>
     */
    protected function resourceRules(?int $resourceId = null): array
    {
        $clubId = $resourceId
            ? Resource::query()->whereKey($resourceId)->value('club_id')
            : null;

        return [
            'club_id' => ['required', 'integer', Rule::exists(Club::class, 'id')],
            'sport' => ['required', Rule::enum(Sport::class)],
            'name' => ['required', 'string', 'max:255'],
            'resource_number' => [
                'required',
                'string',
                'max:50',
                Rule::unique(Resource::class, 'resource_number')
                    ->where('club_id', $clubId ?? request()->input('club_id'))
                    ->ignore($resourceId),
            ],
            'surface_type' => ['required', 'string', Rule::in(['hard', 'clay', 'grass', 'carpet', 'synthetic'])],
            'location_type' => ['required', 'string', Rule::in(['indoor', 'outdoor'])],
            'has_lighting' => ['sometimes', 'boolean'],
            'hourly_rate' => ['required', 'numeric', 'min:0'],
            'status' => ['sometimes', 'string', Rule::enum(ResourceStatus::class)],
            'photos' => ['nullable', 'array'],
            'photos.*' => ['string', 'max:255'],
            'description' => ['nullable', 'string'],
            'metadata' => ['nullable', 'array'],
        ];
    }
}
