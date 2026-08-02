<?php

namespace App\Http\Requests;

use App\Concerns\AnnouncementValidationRules;
use App\Models\Announcement;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreAnnouncementRequest extends FormRequest
{
    use AnnouncementValidationRules;

    public function authorize(): bool
    {
        return $this->user()->can('create', Announcement::class);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return $this->announcementRules();
    }
}
