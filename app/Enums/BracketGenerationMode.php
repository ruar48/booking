<?php

namespace App\Enums;

enum BracketGenerationMode: string
{
    case Automatic = 'automatic';
    case Random = 'random';
    case Manual = 'manual';
}
