<?php

namespace App\Enums;

enum RentalMovementType: string
{
    case Restock = 'restock';
    case CheckOut = 'check_out';
    case Return = 'return';
    case Adjustment = 'adjustment';
    case Lost = 'lost';

    public function label(): string
    {
        return match ($this) {
            self::Restock => 'Restock',
            self::CheckOut => 'Checked out',
            self::Return => 'Returned',
            self::Adjustment => 'Adjustment',
            self::Lost => 'Lost',
        };
    }
}
