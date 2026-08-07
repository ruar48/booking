<?php

namespace App\Concerns;

use App\Enums\PaymentMethod;
use App\Models\Product;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rule;

trait SaleValidationRules
{
    /**
     * @return array<string, array<int, ValidationRule|array<mixed>|string>>
     */
    protected function saleRules(): array
    {
        return [
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', Rule::exists(Product::class, 'id')],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'payment_method' => ['required', Rule::enum(PaymentMethod::class)],
            'customer_id' => ['nullable', 'integer', Rule::exists(User::class, 'id')],
            'discount' => ['nullable', 'numeric', 'min:0'],
            'tax' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
