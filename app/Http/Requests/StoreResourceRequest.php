<?php

namespace App\Http\Requests;

use App\Concerns\CourtValidationRules;
use App\Models\Court;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreCourtRequest extends FormRequest
{
    use CourtValidationRules;

    public function authorize(): bool
    {
        return $this->user()->can('create', Court::class);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return $this->courtRules();
    }
}
