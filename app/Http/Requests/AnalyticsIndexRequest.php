<?php

namespace App\Http\Requests;

use App\Services\SiteAnalyticsService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AnalyticsIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'range' => ['nullable', 'integer', Rule::in(SiteAnalyticsService::RANGES)],
        ];
    }

    public function range(): int
    {
        return (int) ($this->validated('range') ?? 30);
    }
}
