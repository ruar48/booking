<?php

namespace App\Enums;

enum CourtStatus: string
{
    case Available = 'available';
    case Maintenance = 'maintenance';
    case Unavailable = 'unavailable';
}
