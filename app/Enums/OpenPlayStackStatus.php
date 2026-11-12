<?php

namespace App\Enums;

/**
 * Where a player is in a paddle-stacking session's rotation.
 */
enum OpenPlayStackStatus: string
{
    /** In line for the next free court. */
    case Waiting = 'waiting';

    /** On a court right now. */
    case Playing = 'playing';

    /** Checked in earlier but out of the line (a break, or gone home). */
    case SittingOut = 'sitting_out';
}
