<?php

namespace App\Http\Requests\Booking;

use App\Models\Resource;
use Illuminate\Auth\Access\Response;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class RescheduleResourceBookingRequest extends FormRequest
{
    /**
     * Returns the Gate's Response rather than a bool so the policy's reason
     * for refusing survives into the AuthorizationException — a plain `can()`
     * would flatten it to "This action is unauthorized."
     */
    public function authorize(): Response
    {
        return Gate::forUser($this->user())->inspect('reschedule', $this->route('booking'));
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'resource_id' => ['required', 'integer', Rule::exists(Resource::class, 'id')],
            'starts_at' => ['required', 'date', 'after:now'],
            'ends_at' => ['required', 'date', 'after:starts_at'],
        ];
    }
}
