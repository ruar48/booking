<?php

namespace App\Enums;

enum MessengerDirection: string
{
    case Inbound = 'inbound';
    case Outbound = 'outbound';
}
