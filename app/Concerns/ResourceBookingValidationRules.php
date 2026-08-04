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

    /**
     * @return array<string, array<int, ValidationRule|array<mixed>|string>>
     */
    protected function walkInBookingRules(): array
    {
        return [
            'bookings' => ['required', 'array', 'min:1', 'max:24'],
            'bookings.*.resource_id' => ['required', 'integer', Rule::exists(Resource::class, 'id')],
            'bookings.*.starts_at' => ['required', 'date'],
            'bookings.*.ends_at' => ['required', 'date'],
            'customer.mode' => ['required', 'string', 'in:existing,new'],
            'customer.user_id' => ['required_if:customer.mode,existing', 'integer', 'exists:users,id'],
            'customer.name' => ['required_if:customer.mode,new', 'string', 'max:255'],
            'customer.phone' => ['required_if:customer.mode,new', 'string', 'max:50'],
            'mark_paid' => ['sometimes', 'boolean'],
        ];
    }
}
