<?php

namespace App\Http\Requests\Booking;

use App\Models\ResourceBooking;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreBulkResourceBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', ResourceBooking::class);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'bookings' => ['required', 'array', 'min:1', 'max:24'],
            'bookings.*.resource_id' => ['required', 'integer', 'exists:resources,id'],
            'bookings.*.starts_at' => ['required', 'date', 'after:now'],
            'bookings.*.ends_at' => ['required', 'date'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            foreach ($this->input('bookings', []) as $index => $booking) {
                $startsAt = $booking['starts_at'] ?? null;
                $endsAt = $booking['ends_at'] ?? null;

                if ($startsAt && $endsAt && $endsAt <= $startsAt) {
                    $validator->errors()->add(
                        "bookings.{$index}.ends_at",
                        __('The end time must be after the start time.'),
                    );
                }
            }
        });
    }
}
