<?php

namespace App\Http\Requests;

use App\Models\ClubEvent;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateOpenPlayRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('open_play'));
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['required', 'date', 'after:starts_at'],
            'location' => ['nullable', 'string', 'max:255'],
            'price_per_player' => ['nullable', 'numeric', 'min:0'],
            'max_players' => ['nullable', 'integer', 'min:1', 'max:100'],
            'skill_level' => ['required', 'string', Rule::in(['all_levels', 'beginner', 'intermediate', 'advanced'])],
        ];
    }
}
