<?php

namespace App\Http\Requests;

use App\Concerns\CourtBookingValidationRules;
use App\Models\CourtBooking;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreCourtBookingRequest extends FormRequest
{
    use CourtBookingValidationRules;

    public function authorize(): bool
    {
        return $this->user()->can('create', CourtBooking::class);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return $this->courtBookingRules();
    }
}
