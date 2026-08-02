<?php

namespace App\Enums;

enum MatchStatus: string
{
    case Scheduled = 'scheduled';
    case InProgress = 'in_progress';
    case Completed = 'completed';
    case Walkover = 'walkover';
    case Forfeit = 'forfeit';
    case Cancelled = 'cancelled';
}
