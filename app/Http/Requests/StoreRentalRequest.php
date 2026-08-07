<?php

namespace App\Http\Requests;

use App\Models\RentalItem;
use App\Models\RentalTransaction;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRentalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', RentalTransaction::class);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'items' => ['required', 'array', 'min:1'],
            'items.*.rental_item_id' => ['required', 'integer', Rule::exists(RentalItem::class, 'id')],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'renter_id' => ['nullable', 'integer', Rule::exists(User::class, 'id')],
            'renter_name' => ['nullable', 'string', 'max:255'],
            'due_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
