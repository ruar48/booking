<?php

namespace App\Enums;

enum ResourceStatus: string
{
    case Available = 'available';
    case Maintenance = 'maintenance';
    case Unavailable = 'unavailable';
}
