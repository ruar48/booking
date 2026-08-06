<?php

namespace App\Enums;

enum BracketSide: string
{
    case Winners = 'winners';
    case Losers = 'losers';
    case Final = 'final';
}
