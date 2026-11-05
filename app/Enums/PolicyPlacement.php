<?php

namespace App\Enums;

/**
 * Where an admin-managed policy is shown to players.
 */
enum PolicyPlacement: string
{
    /** Agreed to on the payment step of court and Open Play checkout. */
    case Checkout = 'checkout';

    /** House rules: shown on the home and booking pages, the FAQ and the Terms. */
    case CourtRules = 'court_rules';

    /** Kept on file but not shown anywhere yet. */
    case General = 'general';

    public function label(): string
    {
        return match ($this) {
            self::Checkout => 'Booking checkout (payment step)',
            self::CourtRules => 'Court rules (home & booking pages)',
            self::General => 'Not shown yet',
        };
    }
}
