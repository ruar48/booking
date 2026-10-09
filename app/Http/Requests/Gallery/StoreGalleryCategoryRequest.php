<?php

namespace App\Http\Requests\Gallery;

use App\Models\GalleryCategory;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreGalleryCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', GalleryCategory::class);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:60', 'unique:gallery_categories,name'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.unique' => 'There is already a category with that name.',
        ];
    }
}
