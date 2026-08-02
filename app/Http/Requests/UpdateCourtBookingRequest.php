<?php

namespace App\Http\Requests;

use App\Concerns\CourtBookingValidationRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateCourtBookingRequest extends FormRequest
{
    use CourtBookingValidationRules;

    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('booking'));
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return $this->courtBookingAdminRules();
    }
}
