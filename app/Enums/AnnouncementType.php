<?php

namespace App\Enums;

enum AnnouncementType: string
{
    case General = 'general';
    case OpenPlay = 'open_play';
    case Discount = 'discount';
    case Maintenance = 'maintenance';

    public function label(): string
    {
        return match ($this) {
            self::General => 'General / News',
            self::OpenPlay => 'Open Play / Event',
            self::Discount => 'Discount / Promo',
            self::Maintenance => 'Maintenance / Closure',
        };
    }

    public function emailPrefix(): ?string
    {
        return match ($this) {
            self::Discount => 'Promo',
            self::Maintenance => 'Notice',
            self::OpenPlay => 'Event',
            self::General => null,
        };
    }
}
