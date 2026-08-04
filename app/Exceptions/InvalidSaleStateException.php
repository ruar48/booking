<?php

namespace App\Exceptions;

use Exception;

class InvalidSaleStateException extends Exception
{
    public function __construct(string $message = 'This sale cannot be modified in its current state.')
    {
        parent::__construct($message);
    }
}
