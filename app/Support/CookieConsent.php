<?php

namespace App\Support;

use Illuminate\Http\Request;

/**
 * The visitor's cookie choices, as saved by the consent banner
 * (resources/js/lib/cookie-consent.ts) in a plain, unencrypted cookie so both
 * sides can read it. Anything missing or malformed counts as "no".
 */
final class CookieConsent
{
    public const COOKIE = 'cookie_consent';

    private function __construct(
        private readonly bool $analytics,
    ) {}

    public static function fromRequest(Request $request): self
    {
        $raw = $request->cookie(self::COOKIE);
        $choices = is_string($raw) ? json_decode($raw, true) : null;

        return new self(
            analytics: is_array($choices) && ($choices['analytics'] ?? null) === true,
        );
    }

    public function allowsAnalytics(): bool
    {
        return $this->analytics;
    }
}
