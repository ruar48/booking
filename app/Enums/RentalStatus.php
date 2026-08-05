<?php

namespace App\Enums;

enum RentalStatus: string
{
    case Active = 'active';
    case Returned = 'returned';
    case Overdue = 'overdue';
    case Lost = 'lost';

    public function label(): string
    {
        return match ($this) {
            self::Active => 'Active',
            self::Returned => 'Returned',
            self::Overdue => 'Overdue',
            self::Lost => 'Lost',
        };
    }
}
