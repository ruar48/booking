<?php

namespace App\Enums;

/**
 * Bookable sports. Case order is the display order (schedule tabs, filters,
 * stats); the frontend mirror lives in resources/js/lib/sport.ts.
 */
enum Sport: string
{
    case Pickleball = 'pickleball';
    // Stored value stays plural so existing rows need no data migration.
    case Billiards = 'billiards';
    case TableTennis = 'table_tennis';
    case PickleRange = 'pickle_range';

    public function label(): string
    {
        return match ($this) {
            self::Pickleball => 'Pickleball',
            self::Billiards => 'Billiard',
            self::TableTennis => 'Table Tennis',
            self::PickleRange => 'Pickle Range',
        };
    }

    /**
     * Plural noun for this sport's bookable resources ("courts", "tables").
     */
    public function unitNoun(): string
    {
        return match ($this) {
            self::Pickleball => 'courts',
            self::Billiards, self::TableTennis => 'tables',
            self::PickleRange => 'stations',
        };
    }
}
