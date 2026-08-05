<?php

namespace App\Exceptions;

use Exception;

class InsufficientRentalStockException extends Exception
{
    public function __construct(string $message = 'Insufficient rental stock to complete this operation.')
    {
        parent::__construct($message);
    }
}
