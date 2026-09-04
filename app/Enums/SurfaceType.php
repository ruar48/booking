<?php

namespace App\Enums;

/**
 * Playing surfaces.
 *
 * The allowed list and the edit form's dropdown used to be maintained
 * separately and had drifted apart: every seeded court is 'acrylic', which the
 * validation list omitted, so those courts failed to save and rendered with an
 * empty Surface field. This enum is now the single source for both.
 */
enum SurfaceType: string
{
    case Acrylic = 'acrylic';
    case Cushioned = 'cushioned';
    case Hard = 'hard';
    case Synthetic = 'synthetic';
    case Carpet = 'carpet';
    case Clay = 'clay';
    case Grass = 'grass';
    case Sport = 'sport';
    case Felt = 'felt';

    public function label(): string
    {
        return match ($this) {
            self::Acrylic => 'Acrylic',
            self::Cushioned => 'Cushioned',
            self::Hard => 'Hard court',
            self::Synthetic => 'Synthetic',
            self::Carpet => 'Carpet',
            self::Clay => 'Clay',
            self::Grass => 'Grass',
            self::Sport => 'Sport court',
            self::Felt => 'Felt',
        };
    }

    /**
     * Options for a select, in the shape the frontend renders.
     *
     * @return list<array{value: string, label: string}>
     */
    public static function options(): array
    {
        return array_map(
            fn (self $case) => ['value' => $case->value, 'label' => $case->label()],
            self::cases(),
        );
    }
}
