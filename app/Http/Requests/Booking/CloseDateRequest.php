<?php

namespace App\Http\Requests\Booking;

use App\Models\ResourceBooking;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class CloseDateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('viewAny', ResourceBooking::class);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'date' => ['required', 'date'],
            'reason' => ['nullable', 'string', 'max:255'],
            'redirect_start' => ['nullable', 'date'],
            'redirect_end' => ['nullable', 'date'],
        ];
    }
}
