<?php

namespace App\Http\Requests\Booking;

use App\Models\ResourceBooking;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ReopenDateRequest extends FormRequest
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
            'date' => ['required', 'date', 'after_or_equal:today'],
            'open_time' => ['required', 'date_format:H:i'],
            'close_time' => ['required', 'date_format:H:i', 'after:open_time'],
            'redirect_start' => ['nullable', 'date'],
            'redirect_end' => ['nullable', 'date'],
        ];
    }
}
