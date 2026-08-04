<?php

namespace App\Http\Requests;

use App\Concerns\ResourceBookingValidationRules;
use App\Models\ResourceBooking;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreResourceBookingRequest extends FormRequest
{
    use ResourceBookingValidationRules;

    public function authorize(): bool
    {
        return $this->user()->can('create', ResourceBooking::class);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return $this->resourceBookingRules();
    }
}
