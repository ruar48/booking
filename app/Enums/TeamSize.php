<?php

namespace App\Enums;

enum TeamSize: string
{
    case Singles = 'singles';
    case Doubles = 'doubles';

    /** How many players one game takes — the size of each group called from the paddle stack. */
    public function playersPerCourt(): int
    {
        return match ($this) {
            self::Singles => 2,
            self::Doubles => 4,
        };
    }
}
