<?php

namespace App\Concerns;

use App\Models\Club;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rule;

trait AnnouncementValidationRules
{
    /**
     * @return array<string, array<int, ValidationRule|array<mixed>|string>>
     */
    protected function announcementRules(): array
    {
        return [
            'club_id' => ['nullable', 'integer', Rule::exists(Club::class, 'id')],
            'title' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string'],
            'show_on_dashboard' => ['sometimes', 'boolean'],
            'show_on_home' => ['sometimes', 'boolean'],
            'show_on_player_portal' => ['sometimes', 'boolean'],
            'is_published' => ['sometimes', 'boolean'],
            'published_at' => ['nullable', 'date'],
        ];
    }
}
