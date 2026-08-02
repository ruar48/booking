<?php

namespace App\Http\Requests;

use App\Concerns\PlayerValidationRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdatePlayerRequest extends FormRequest
{
    use PlayerValidationRules;

    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('player'));
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return $this->playerRules($this->route('player')->id);
    }
}
