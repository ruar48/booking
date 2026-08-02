<?php

namespace App\Http\Requests;

use App\Concerns\ClubValidationRules;
use App\Models\Club;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreClubRequest extends FormRequest
{
    use ClubValidationRules;

    public function authorize(): bool
    {
        return $this->user()->can('create', Club::class);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return $this->clubRules();
    }
}
