<?php

namespace App\Http\Requests;

use App\Concerns\CourtValidationRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateCourtRequest extends FormRequest
{
    use CourtValidationRules;

    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('court'));
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return $this->courtRules($this->route('court')->id);
    }
}
