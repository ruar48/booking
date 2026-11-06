<?php

namespace App\Integrations\Meta;

use RuntimeException;

/**
 * A Graph API call that Meta refused or that never reached it. Carries Meta's
 * own error code so callers can tell "this person can't be messaged" apart
 * from an outage. Never carries the access token.
 */
class MessengerException extends RuntimeException
{
    /**
     * Meta's "(#551) This person isn't available right now" (they blocked the
     * Page or deleted their account) and "No matching user found" (the PSID
     * is not one of this Page's).
     */
    private const RECIPIENT_UNAVAILABLE_CODES = [551];

    private const RECIPIENT_UNAVAILABLE_SUBCODES = [1545041, 2018001];

    public function __construct(
        string $message,
        public readonly ?int $graphCode = null,
        public readonly ?int $graphSubcode = null,
    ) {
        parent::__construct($message);
    }

    public function recipientUnavailable(): bool
    {
        return in_array($this->graphCode, self::RECIPIENT_UNAVAILABLE_CODES, true)
            || in_array($this->graphSubcode, self::RECIPIENT_UNAVAILABLE_SUBCODES, true);
    }
}
