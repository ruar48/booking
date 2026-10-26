<?php

namespace App\Http\Requests;

use App\Concerns\CoachValidationRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateCoachRequest extends FormRequest
{
    use CoachValidationRules;

    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('coach'));
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return $this->coachRules();
    }
}
