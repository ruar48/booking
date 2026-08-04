<?php

namespace App\Concerns;

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Models\Resource;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rule;

trait ResourceBookingValidationRules
{
    /**
     * @return array<string, array<int, ValidationRule|array<mixed>|string>>
     */
    protected function resourceBookingRules(): array
    {
        return [
            'resource_id' => ['required', 'integer', Rule::exists(Resource::class, 'id')],
            'starts_at' => ['required', 'date', 'after:now'],
            'ends_at' => ['required', 'date', 'after:starts_at'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * @return array<string, array<int, ValidationRule|array<mixed>|string>>
     */
    protected function resourceBookingAdminRules(): array
    {
        return array_merge($this->resourceBookingRules(), [
            'status' => ['sometimes', 'string', Rule::enum(BookingStatus::class)],
            'payment_status' => ['sometimes', 'string', Rule::enum(PaymentStatus::class)],
            'amount' => ['sometimes', 'numeric', 'min:0'],
            'cancellation_reason' => ['nullable', 'string', 'max:1000'],
        ]);
    }
}
