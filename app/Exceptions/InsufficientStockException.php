<?php

namespace App\Exceptions;

use Exception;

class InsufficientStockException extends Exception
{
    public function __construct(string $message = 'Insufficient stock to complete this operation.')
    {
        parent::__construct($message);
    }
}
