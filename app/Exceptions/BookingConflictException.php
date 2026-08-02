<?php

namespace App\Exceptions;

use Exception;

class BookingConflictException extends Exception
{
    public function __construct(string $message = 'The selected time slot conflicts with an existing booking.')
    {
        parent::__construct($message);
    }
}
