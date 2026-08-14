<?php

namespace App\Models;

use App\Enums\AnnouncementType;
use Database\Factories\AnnouncementFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

/**
 * @property int $id
 * @property int $created_by
 * @property string $title
 * @property string $content
 * @property AnnouncementType $type
 * @property int|null $open_play_session_id
 * @property string|null $image_path
 * @property string|null $image_source
 * @property bool $show_on_dashboard
 * @property bool $show_on_home
 * @property bool $show_on_player_portal
 * @property bool $is_published
 * @property Carbon|null $published_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 */
#[Fillable([
    'created_by',
    'title',
    'content',
    'type',
    'open_play_session_id',
    'image_path',
    'image_source',
    'show_on_dashboard',
    'show_on_home',
    'show_on_player_portal',
    'is_published',
    'published_at',
])]
class Announcement extends Model
{
    /** @use HasFactory<AnnouncementFactory> */
    use HasFactory, SoftDeletes;

    protected $appends = ['image_url'];

    protected function casts(): array
    {
        return [
            'type' => AnnouncementType::class,
            'show_on_dashboard' => 'boolean',
            'show_on_home' => 'boolean',
            'show_on_player_portal' => 'boolean',
            'is_published' => 'boolean',
            'published_at' => 'datetime',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function openPlaySession(): BelongsTo
    {
        return $this->belongsTo(OpenPlaySession::class);
    }

    protected function imageUrl(): Attribute
    {
        return Attribute::make(
            get: fn (): ?string => $this->image_path
                ? Storage::disk('announcements')->url($this->image_path)
                : null,
        );
    }
}
