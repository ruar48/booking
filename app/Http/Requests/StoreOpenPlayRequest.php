<?php

namespace App\Http\Requests;

use App\Enums\BracketGenerationMode;
use App\Enums\TeamSize;
use App\Enums\TournamentFormat;
use App\Models\ClubEvent;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

class StoreOpenPlayRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', ClubEvent::class);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'club_id' => ['required', 'integer', 'exists:clubs,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'starts_at' => ['required', 'date', 'after:now'],
            'ends_at' => ['required', 'date', 'after:starts_at'],
            'location' => ['nullable', 'string', 'max:255'],
            'price_per_player' => ['nullable', 'numeric', 'min:0'],
            'max_players' => ['nullable', 'integer', 'min:1', 'max:100'],
            'skill_level' => ['required', 'string', Rule::in(['all_levels', 'beginner', 'intermediate', 'advanced'])],
            'bracket_format' => ['required', new Enum(TournamentFormat::class)],
            'bracket_generation' => ['required', new Enum(BracketGenerationMode::class)],
            'team_size' => ['required', new Enum(TeamSize::class)],
        ];
    }
}
