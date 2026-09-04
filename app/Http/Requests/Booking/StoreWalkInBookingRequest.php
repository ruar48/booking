<?php

namespace App\Http\Requests\Booking;

use App\Concerns\ResourceBookingValidationRules;
use App\Models\ResourceBooking;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class StoreWalkInBookingRequest extends FormRequest
{
    use ResourceBookingValidationRules;

    public function authorize(): bool
    {
        return $this->user()?->can('createForOther', ResourceBooking::class) ?? false;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return $this->walkInBookingRules();
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
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
