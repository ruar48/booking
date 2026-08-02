<?php

namespace App\Http\Requests;

use App\Concerns\ClubValidationRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateClubRequest extends FormRequest
{
    use ClubValidationRules;

    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('club'));
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return $this->clubRules($this->route('club')->id);
    }
}
