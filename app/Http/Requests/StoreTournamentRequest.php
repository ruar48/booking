<?php

namespace App\Http\Requests;

use App\Concerns\TournamentValidationRules;
use App\Models\Tournament;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreTournamentRequest extends FormRequest
{
    use TournamentValidationRules;

    public function authorize(): bool
    {
        return $this->user()->can('create', Tournament::class);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return $this->tournamentRules();
    }
}
