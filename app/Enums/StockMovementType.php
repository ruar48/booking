<?php

namespace App\Enums;

enum StockMovementType: string
{
    case Restock = 'restock';
    case Sale = 'sale';
    case Adjustment = 'adjustment';
    case Return = 'return';
    case Wastage = 'wastage';

    public function label(): string
    {
        return match ($this) {
            self::Restock => 'Restock',
            self::Sale => 'Sale',
            self::Adjustment => 'Adjustment',
            self::Return => 'Return',
            self::Wastage => 'Wastage',
        };
    }
}
