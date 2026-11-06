<?php

namespace App\Enums;

/**
 * Where a message in a Messenger conversation came from.
 */
enum MessengerMessageSource: string
{
    /** Written by the person in Messenger. */
    case Customer = 'customer';

    /** Typed by staff in this system's inbox. */
    case Reply = 'reply';

    /** Typed by staff in Facebook's own Page inbox or Meta Business Suite. */
    case PageInbox = 'page_inbox';

    /** A booking or payment notification. */
    case Notification = 'notification';

    /** An Open Play announcement. */
    case Announcement = 'announcement';

    /** Connection confirmations and test messages. */
    case System = 'system';

    public function label(): string
    {
        return match ($this) {
            self::Customer => 'Customer',
            self::Reply => 'Reply',
            self::PageInbox => 'Sent from Facebook',
            self::Notification => 'Automatic update',
            self::Announcement => 'Open Play announcement',
            self::System => 'Automatic message',
        };
    }
}
