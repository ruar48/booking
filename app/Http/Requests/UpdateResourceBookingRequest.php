<?php

namespace App\Http\Requests;

use App\Concerns\ResourceBookingValidationRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateResourceBookingRequest extends FormRequest
{
    use ResourceBookingValidationRules;

    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('booking'));
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return $this->resourceBookingAdminRules();
    }
}
