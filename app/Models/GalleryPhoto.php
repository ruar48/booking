<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

/**
 * @property int $id
 * @property int|null $gallery_category_id
 * @property string $path Relative to the 'gallery' disk.
 * @property string|null $caption
 * @property int $sort_order
 * @property int|null $uploaded_by
 * @property-read string $url
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'gallery_category_id',
    'path',
    'caption',
    'sort_order',
    'uploaded_by',
])]
class GalleryPhoto extends Model
{
    protected $appends = ['url'];

    public function category(): BelongsTo
    {
        return $this->belongsTo(GalleryCategory::class, 'gallery_category_id');
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    protected function url(): Attribute
    {
        return Attribute::get(fn (): string => Storage::disk('gallery')->url($this->path));
    }
}
