<?php

namespace App\Concerns;

use App\Models\Club;
use App\Models\Coach;
use App\Models\Resource;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rule;

trait TrainingSessionValidationRules
{
    /**
     * @return array<string, array<int, ValidationRule|array<mixed>|string>>
     */
    protected function trainingSessionRules(): array
    {
        return [
            'coach_id' => ['required', 'integer', Rule::exists(Coach::class, 'id')],
            'club_id' => ['required', 'integer', Rule::exists(Club::class, 'id')],
            'court_id' => ['nullable', 'integer', Rule::exists(Resource::class, 'id')],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'scheduled_at' => ['required', 'date', 'after:now'],
            'duration_minutes' => ['required', 'integer', 'min:15', 'max:480'],
            'notes' => ['nullable', 'string'],
            'status' => ['sometimes', 'string', Rule::in(['scheduled', 'in_progress', 'completed', 'cancelled'])],
        ];
    }
}
