<?php

namespace App\Concerns;

use App\Enums\ResourceStatus;
use App\Enums\Sport;
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
        return [
            'sport' => ['required', Rule::enum(Sport::class)],
            'name' => ['required', 'string', 'max:255'],
            'resource_number' => [
                'required',
                'string',
                'max:50',
                Rule::unique(Resource::class, 'resource_number')
                    ->where(fn ($query) => $query->where('sport', $this->input('sport')))
                    ->ignore($resourceId),
            ],
            'surface_type' => [
                'required_if:sport,'.Sport::Pickleball->value,
                'nullable',
                'string',
                Rule::in(['hard', 'clay', 'grass', 'carpet', 'synthetic', 'felt']),
            ],
            'location_type' => [
                'required_if:sport,'.Sport::Pickleball->value,
                'nullable',
                'string',
                Rule::in(['indoor', 'outdoor']),
            ],
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
