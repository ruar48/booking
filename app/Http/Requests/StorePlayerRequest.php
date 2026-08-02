<?php

namespace App\Http\Requests;

use App\Concerns\PlayerValidationRules;
use App\Models\Player;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StorePlayerRequest extends FormRequest
{
    use PlayerValidationRules;

    public function authorize(): bool
    {
        return $this->user()->can('create', Player::class);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return $this->playerRules();
    }
}
