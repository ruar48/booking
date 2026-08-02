<?php

namespace App\Http\Requests;

use App\Concerns\TrainingSessionValidationRules;
use App\Models\TrainingSession;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreTrainingSessionRequest extends FormRequest
{
    use TrainingSessionValidationRules;

    public function authorize(): bool
    {
        return $this->user()->can('create', TrainingSession::class);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return $this->trainingSessionRules();
    }
}
