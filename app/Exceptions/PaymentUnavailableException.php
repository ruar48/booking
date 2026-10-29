<?php

namespace App\Exceptions;

use Exception;

/**
 * A checkout that cannot (or should not) start a payment right now. The
 * message is always safe to show the customer; the underlying cause, when
 * there is one, is logged where it is thrown.
 */
class PaymentUnavailableException extends Exception
{
    public function __construct(string $message = 'We could not start your payment. Please try again in a moment.')
    {
        parent::__construct($message);
    }
}
