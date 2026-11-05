<?php

namespace App\Support;

use App\Models\Setting;

/**
 * Who runs the venue, as the legal pages and FAQ have to state it: the
 * business behind the bookings, where to reach it, and who handles privacy
 * requests. Read from the venue profile an admin maintains in Settings.
 */
final class BusinessIdentity
{
    public function __construct(
        public readonly string $name,
        public readonly ?string $legalName,
        public readonly ?string $registrationNumber,
        public readonly ?string $address,
        public readonly ?string $email,
        public readonly ?string $phone,
        public readonly ?string $website,
        public readonly ?string $dpoName,
        public readonly ?string $dpoEmail,
    ) {}

    public static function current(): self
    {
        /** @var array<string, mixed> $profile */
        $profile = Setting::query()
            ->where('group', 'venue')
            ->where('key', 'profile')
            ->value('value') ?? [];

        $field = fn (string $key): ?string => filled($profile[$key] ?? null) ? trim((string) $profile[$key]) : null;
        $email = $field('email');

        return new self(
            // Same fallback as the receipt and the emailed receipt.
            name: $field('name') ?? (string) config('app.name'),
            legalName: $field('legal_name'),
            registrationNumber: $field('registration_number'),
            address: self::address($profile),
            email: $email,
            phone: $field('phone'),
            website: $field('website'),
            dpoName: $field('dpo_name'),
            // Privacy requests still need somewhere to go before a DPO email
            // is set, so the venue's own inbox stands in.
            dpoEmail: $field('dpo_email') ?? $email,
        );
    }

    /**
     * @return array<string, string|null>
     */
    public function toArray(): array
    {
        return [
            'name' => $this->name,
            'legal_name' => $this->legalName,
            'registration_number' => $this->registrationNumber,
            'address' => $this->address,
            'email' => $this->email,
            'phone' => $this->phone,
            'website' => $this->website,
            'dpo_name' => $this->dpoName,
            'dpo_email' => $this->dpoEmail,
        ];
    }

    /**
     * @param  array<string, mixed>  $profile
     */
    private static function address(array $profile): ?string
    {
        $part = fn (string $key): string => trim((string) ($profile[$key] ?? ''));
        $country = $part('country');

        $address = collect([
            $part('address_line_1'),
            $part('city'),
            trim($part('state').' '.$part('postal_code')),
            strtoupper($country) === 'PH' ? 'Philippines' : $country,
        ])->filter()->implode(', ');

        return $address !== '' ? $address : null;
    }
}
