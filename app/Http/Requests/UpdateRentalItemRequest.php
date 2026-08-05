<?php

namespace App\Http\Requests;

use App\Concerns\RentalItemValidationRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateRentalItemRequest extends FormRequest
{
    use RentalItemValidationRules;

    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('rental_item'));
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return $this->rentalItemRules($this->route('rental_item')->id);
    }
}
