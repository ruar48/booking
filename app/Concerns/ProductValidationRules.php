<?php

namespace App\Concerns;

use App\Enums\ProductStatus;
use App\Models\Club;
use App\Models\Product;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rule;

trait ProductValidationRules
{
    /**
     * @return array<string, array<int, ValidationRule|array<mixed>|string>>
     */
    protected function productRules(?int $productId = null): array
    {
        return [
            'club_id' => ['required', 'integer', Rule::exists(Club::class, 'id')],
            'name' => ['required', 'string', 'max:255'],
            'sku' => [
                'required',
                'string',
                'max:100',
                Rule::unique(Product::class, 'sku')->ignore($productId),
            ],
            'category' => ['nullable', 'string', 'max:100'],
            'price' => ['required', 'numeric', 'min:0'],
            'cost' => ['nullable', 'numeric', 'min:0'],
            'stock_quantity' => ['required', 'integer', 'min:0'],
            'low_stock_threshold' => ['required', 'integer', 'min:0'],
            'status' => ['required', Rule::enum(ProductStatus::class)],
            'photos' => ['nullable', 'array'],
            'photos.*' => ['string', 'max:255'],
            'description' => ['nullable', 'string'],
        ];
    }
}
