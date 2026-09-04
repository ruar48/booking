<?php

namespace App\Http\Requests\Booking;

use App\Enums\PaymentMethod;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class CheckoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('view', $this->route('booking'));
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'payment_method' => ['required', 'in:qrph,gcash,maya'],
        ];
    }

    /**
     * Only QR Ph is live. The other methods are offered in the UI but rejected
     * here with their own name, rather than a generic "invalid" message.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $method = $this->input('payment_method');

            if ($method === null || $method === 'qrph' || $validator->errors()->has('payment_method')) {
                return;
            }

            $validator->errors()->add('payment_method', __(':method is coming soon — please pay with QR Ph for now.', [
                'method' => PaymentMethod::from($method)->label(),
            ]));
        });
    }
}
