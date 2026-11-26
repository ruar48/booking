<?php

namespace App\Http\Requests\OpenPlay;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Staff registering someone at the venue who has no account yet.
 */
class StoreOpenPlayWalkInRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('open_play'));
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:50'],
            'mark_paid' => ['sometimes', 'boolean'],
        ];
    }
}
