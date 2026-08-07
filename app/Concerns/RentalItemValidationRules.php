<?php

namespace App\Concerns;

use App\Enums\RentalItemStatus;
use App\Models\RentalItem;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rule;

trait RentalItemValidationRules
{
    /**
     * @return array<string, array<int, ValidationRule|array<mixed>|string>>
     */
    protected function rentalItemRules(?int $rentalItemId = null): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'sku' => [
                'required',
                'string',
                'max:100',
                Rule::unique(RentalItem::class, 'sku')->ignore($rentalItemId),
            ],
            'category' => ['nullable', 'string', 'max:100'],
            'rate' => ['required', 'numeric', 'min:0'],
            'hourly_rate' => ['nullable', 'numeric', 'min:0'],
            'deposit' => ['nullable', 'numeric', 'min:0'],
            'total_quantity' => ['required', 'integer', 'min:0'],
            'status' => ['required', Rule::enum(RentalItemStatus::class)],
            'description' => ['nullable', 'string'],
        ];
    }
}
