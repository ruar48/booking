<?php

namespace App\Http\Requests\Gallery;

use App\Models\GalleryPhoto;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreGalleryPhotoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', GalleryPhoto::class);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'photos' => ['required', 'array', 'min:1', 'max:10'],
            'photos.*' => ['image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'caption' => ['nullable', 'string', 'max:120'],
            'gallery_category_id' => ['nullable', 'integer', 'exists:gallery_categories,id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'photos.*.image' => 'Each file must be a photo.',
            'photos.*.mimes' => 'Photos must be JPG, PNG or WebP.',
            'photos.*.max' => 'Each photo must be 5 MB or smaller.',
            // "uploaded" fails when PHP itself rejects the file, almost always
            // because it is over the server's upload_max_filesize.
            'photos.*.uploaded' => 'A photo was too large for the server to accept. Try a smaller one.',
            'photos.max' => 'Upload up to 10 photos at a time.',
        ];
    }
}
