<?php

namespace App\Http\Requests;

use App\Concerns\RentalItemValidationRules;
use App\Models\RentalItem;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreRentalItemRequest extends FormRequest
{
    use RentalItemValidationRules;

    public function authorize(): bool
    {
        return $this->user()->can('create', RentalItem::class);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return $this->rentalItemRules();
    }
}
