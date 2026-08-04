<?php

namespace App\Enums;

enum Sport: string
{
    case Pickleball = 'pickleball';
    case Billiards = 'billiards';

    public function label(): string
    {
        return match ($this) {
            self::Pickleball => 'Pickleball',
            self::Billiards => 'Billiards',
        };
    }
}
