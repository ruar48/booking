<?php

namespace App\Concerns;

use Illuminate\Contracts\Validation\ValidationRule;

trait CoachValidationRules
{
    /**
     * @return array<string, array<int, ValidationRule|array<mixed>|string>>
     */
    protected function coachRules(): array
    {
        return [
            'name' => ['required', 'string', 'max:80'],
            'photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'remove_photo' => ['sometimes', 'boolean'],
            'phone' => ['nullable', 'string', 'max:30'],
            'bio' => ['nullable', 'string', 'max:1000'],
            'years_experience' => ['nullable', 'integer', 'min:0', 'max:60'],
            'rate_per_hour' => ['nullable', 'numeric', 'min:0', 'max:100000'],
            'specialties' => ['nullable', 'array', 'max:8'],
            'specialties.*' => ['nullable', 'string', 'max:40'],
            'certifications' => ['nullable', 'array', 'max:8'],
            'certifications.*' => ['nullable', 'string', 'max:80'],
            'availability' => ['nullable', 'array', 'max:28'],
            'availability.*.day' => ['required', 'integer', 'between:0,6'],
            'availability.*.start' => ['required', 'date_format:H:i'],
            'availability.*.end' => ['required', 'date_format:H:i', 'after:availability.*.start'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'availability.*.end.after' => 'Each time slot must end after it starts.',
        ];
    }
}
