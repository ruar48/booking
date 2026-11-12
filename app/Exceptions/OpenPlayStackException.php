<?php

namespace App\Exceptions;

use Exception;

/**
 * A paddle-stack change that the session's current state doesn't allow
 * (player not registered, already in line, no game on that court…). The
 * message is always safe to show.
 */
class OpenPlayStackException extends Exception {}
