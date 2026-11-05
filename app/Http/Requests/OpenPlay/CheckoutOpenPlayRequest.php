<?php

namespace App\Http\Requests\OpenPlay;

use App\Concerns\CheckoutAgreementValidationRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Starting the online payment for the signed-in player's Open Play spot. The
 * controller only ever looks up the requester's own registration, so there is
 * nothing here to authorize beyond being signed in.
 */
class CheckoutOpenPlayRequest extends FormRequest
{
    use CheckoutAgreementValidationRules;

    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'payment_method' => ['required', 'in:qrph'],
            ...$this->checkoutAgreementRules(),
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return $this->checkoutAgreementMessages();
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(fn (Validator $validator) => $this->ensureAgreedPoliciesAreCurrent($validator));
    }
}
