<?php

namespace App\Models;

use App\Enums\BracketSide;
use App\Enums\MatchStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $open_play_session_id
 * @property int|null $entry1_id
 * @property int|null $entry2_id
 * @property int|null $entry1_score
 * @property int|null $entry2_score
 * @property int|null $winner_registration_id
 * @property int $round
 * @property int|null $bracket_position
 * @property BracketSide|null $bracket_side
 * @property MatchStatus $status
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'open_play_session_id',
    'entry1_id',
    'entry2_id',
    'entry1_score',
    'entry2_score',
    'winner_registration_id',
    'round',
    'bracket_position',
    'bracket_side',
    'status',
])]
class OpenPlayMatch extends Model
{
    protected function casts(): array
    {
        return [
            'status' => MatchStatus::class,
            'bracket_side' => BracketSide::class,
        ];
    }

    public function openPlaySession(): BelongsTo
    {
        return $this->belongsTo(OpenPlaySession::class);
    }

    public function entry1(): BelongsTo
    {
        return $this->belongsTo(OpenPlayRegistration::class, 'entry1_id');
    }

    public function entry2(): BelongsTo
    {
        return $this->belongsTo(OpenPlayRegistration::class, 'entry2_id');
    }

    public function winner(): BelongsTo
    {
        return $this->belongsTo(OpenPlayRegistration::class, 'winner_registration_id');
    }
}
