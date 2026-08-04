<?php

namespace App\Concerns;

use App\Models\Club;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rule;

trait ClubValidationRules
{
    /**
     * @return array<string, array<int, ValidationRule|array<mixed>|string>>
     */
    protected function clubRules(?int $clubId = null): array
    {
        return [
            ...$this->operatingHoursRules(),
            'name' => ['required', 'string', 'max:255'],
            'slug' => [
                'required',
                'string',
                'max:255',
                Rule::unique(Club::class)->ignore($clubId),
            ],
            'logo' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'website' => ['nullable', 'url', 'max:255'],
            'address_line_1' => ['nullable', 'string', 'max:255'],
            'address_line_2' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:100'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'country' => ['nullable', 'string', 'max:100'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, array<int, ValidationRule|array<mixed>|string>>
     */
    protected function operatingHoursRules(): array
    {
        $rules = [
            'operating_hours' => ['nullable', 'array'],
        ];

        foreach ([
            'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
        ] as $day) {
            $rules["operating_hours.{$day}"] = ['nullable', 'array'];
            $rules["operating_hours.{$day}.closed"] = ['nullable', 'boolean'];
            $rules["operating_hours.{$day}.open"] = [
                'nullable',
                'string',
                'date_format:H:i',
                Rule::requiredIf(fn () => ! request()->boolean("operating_hours.{$day}.closed")),
            ];
            $rules["operating_hours.{$day}.close"] = [
                'nullable',
                'string',
                'date_format:H:i',
                Rule::requiredIf(fn () => ! request()->boolean("operating_hours.{$day}.closed")),
            ];
        }

        return $rules;
    }
}
