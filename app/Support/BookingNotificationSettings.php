<?php

namespace App\Support;

use App\Models\Setting;

class BookingNotificationSettings
{
    public const EVENT_KEYS = [
        'booking_created',
        'booking_failed',
        'booking_approved',
        'booking_cancelled',
    ];

    /**
     * @return array{enabled: bool, notifyCustomer: bool, notifyOwners: bool}
     */
    public static function config(string $eventKey): array
    {
        $value = Setting::query()
            ->where('group', 'notifications')
            ->where('key', $eventKey)
            ->value('value');

        $enabled = $value['enabled'] ?? true;
        $recipients = $value['recipients'] ?? ['customer', 'owners'];

        return [
            'enabled' => (bool) $enabled,
            'notifyCustomer' => in_array('customer', $recipients, true),
            'notifyOwners' => in_array('owners', $recipients, true),
        ];
    }
}
