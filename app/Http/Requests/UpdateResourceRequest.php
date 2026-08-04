<?php

namespace App\Http\Requests;

use App\Concerns\ResourceValidationRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateResourceRequest extends FormRequest
{
    use ResourceValidationRules;

    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('resource'));
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return $this->resourceRules($this->route('resource')->id);
    }
}
