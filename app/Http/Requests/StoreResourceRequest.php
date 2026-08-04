<?php

namespace App\Http\Requests;

use App\Concerns\ResourceValidationRules;
use App\Models\Resource;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreResourceRequest extends FormRequest
{
    use ResourceValidationRules;

    public function authorize(): bool
    {
        return $this->user()->can('create', Resource::class);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return $this->resourceRules();
    }
}
