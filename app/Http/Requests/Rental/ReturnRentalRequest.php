<?php

namespace App\Http\Requests\Rental;

use App\Models\RentalTransactionItem;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReturnRentalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('return', $this->route('rental_transaction'));
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'items' => ['required', 'array', 'min:1'],
            'items.*.rental_transaction_item_id' => ['required', 'integer', Rule::exists(RentalTransactionItem::class, 'id')],
            'items.*.quantity_returned' => ['required', 'integer', 'min:1'],
        ];
    }
}
