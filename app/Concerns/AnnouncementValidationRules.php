<?php

namespace App\Concerns;

use App\Enums\AnnouncementType;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

trait AnnouncementValidationRules
{
    /**
     * @return array<string, array<int, ValidationRule|array<mixed>|string>>
     */
    protected function announcementRules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string'],
            'type' => ['required', new Enum(AnnouncementType::class)],
            'open_play_session_id' => [
                'nullable',
                Rule::requiredIf($this->input('type') === AnnouncementType::OpenPlay->value),
                'integer',
                'exists:open_play_sessions,id',
            ],
            'image_mode' => ['sometimes', Rule::in(['none', 'upload', 'auto_qr'])],
            'image' => ['nullable', 'image', 'max:4096'],
            'show_on_dashboard' => ['sometimes', 'boolean'],
            'show_on_home' => ['sometimes', 'boolean'],
            'show_on_player_portal' => ['sometimes', 'boolean'],
            'is_published' => ['sometimes', 'boolean'],
            'published_at' => ['nullable', 'date'],
        ];
    }
}
