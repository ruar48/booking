<?php

namespace App\Http\Requests;

use App\Concerns\TournamentValidationRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateTournamentRequest extends FormRequest
{
    use TournamentValidationRules;

    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('tournament'));
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return $this->tournamentRules($this->route('tournament')->id);
    }
}
