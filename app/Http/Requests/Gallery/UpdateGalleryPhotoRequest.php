<?php

namespace App\Http\Requests\Gallery;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateGalleryPhotoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('galleryPhoto'));
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'caption' => ['nullable', 'string', 'max:120'],
            'gallery_category_id' => ['nullable', 'integer', 'exists:gallery_categories,id'],
        ];
    }
}
