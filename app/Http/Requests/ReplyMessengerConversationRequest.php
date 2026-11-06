<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReplyMessengerConversationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('reply', $this->route('conversation')) ?? false;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        // Meta's limit for a text message.
        return [
            'text' => ['required', 'string', 'max:2000'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['text' => trim((string) $this->input('text'))]);
    }
}
