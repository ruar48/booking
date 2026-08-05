<?php

namespace App\Exceptions;

use Exception;

class InvalidRentalStateException extends Exception
{
    public function __construct(string $message = 'This rental cannot be modified in its current state.')
    {
        parent::__construct($message);
    }
}
