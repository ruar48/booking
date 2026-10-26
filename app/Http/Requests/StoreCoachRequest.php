<?php

namespace App\Http\Requests;

use App\Concerns\CoachValidationRules;
use App\Models\Coach;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreCoachRequest extends FormRequest
{
    use CoachValidationRules;

    public function authorize(): bool
    {
        return $this->user()->can('create', Coach::class);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return $this->coachRules();
    }
}
