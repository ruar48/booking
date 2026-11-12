<?php

namespace App\Enums;

/**
 * How an open play session is run once players arrive.
 */
enum OpenPlayFormat: string
{
    /**
     * Classic open play: players queue ("stack their paddles") and the next
     * group in line takes the next free court. No bracket, no fixed partners.
     */
    case PaddleStacking = 'paddle_stacking';

    /** A tournament: round robin or elimination bracket with fixed entries. */
    case Bracket = 'bracket';

    public function label(): string
    {
        return match ($this) {
            self::PaddleStacking => 'Paddle stacking',
            self::Bracket => 'Bracket',
        };
    }
}
