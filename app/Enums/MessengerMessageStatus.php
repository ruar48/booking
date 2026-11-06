<?php

namespace App\Enums;

/**
 * Delivery state of a message. Outgoing messages move forward through
 * Sending → Sent → Delivered → Read as Meta reports back, and never back.
 */
enum MessengerMessageStatus: string
{
    case Received = 'received';
    case Sending = 'sending';
    case Sent = 'sent';
    case Delivered = 'delivered';
    case Read = 'read';
    case Failed = 'failed';
}
