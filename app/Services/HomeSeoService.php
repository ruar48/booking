<?php

namespace App\Services;

use Illuminate\Support\Str;

/**
 * Search-engine metadata for the public home page, built from the venue
 * profile so the town and province appear in the title, description and
 * schema.org data. Local searches ("pickleball court Binalonan") match on
 * those words.
 *
 * Rendered by the Blade root view, so crawlers see it in the HTML the server
 * sends, and also passed to the page as a prop so React's <Head> keeps the
 * same tags once it takes over.
 */
class HomeSeoService
{
    private const DESCRIPTION_LIMIT = 160;

    /**
     * @param  array<string, mixed>  $venue
     * @return array{title: string, description: string, location: string|null, structured_data: array<string, mixed>}
     */
    public function forVenue(array $venue): array
    {
        $name = (string) config('app.name');
        $area = $this->join([$venue['city'] ?? null, $venue['state'] ?? null]);
        $address = $this->join([
            $venue['address_line_1'] ?? null,
            $venue['city'] ?? null,
            $venue['state'] ?? null,
        ]);

        $title = $area
            ? "{$name} | Pickleball Courts in {$area}"
            : "{$name} | Pickleball Courts & Billiards";

        // Google shows about 160 characters; cut on a word boundary if a long address overruns.
        $description = Str::limit(
            ($address ? "Pickleball courts, billiards and table tennis in {$address}. " : "Pickleball courts, billiards and table tennis at {$name}. ")
                .'Book courts online, join open play and rent paddles.',
            self::DESCRIPTION_LIMIT,
            preserveWords: true,
        );

        return [
            'title' => $title,
            'description' => $description,
            'location' => $address,
            'structured_data' => $this->structuredData($name, $description, $venue),
        ];
    }

    /**
     * @param  array<string, mixed>  $venue
     * @return array<string, mixed>
     */
    private function structuredData(string $name, string $description, array $venue): array
    {
        $address = array_filter([
            '@type' => 'PostalAddress',
            'streetAddress' => $venue['address_line_1'] ?? null,
            'addressLocality' => $venue['city'] ?? null,
            'addressRegion' => $venue['state'] ?? null,
            'postalCode' => $venue['postal_code'] ?? null,
            'addressCountry' => $venue['country'] ?? 'PH',
        ]);

        $hasCoordinates = is_numeric($venue['latitude'] ?? null) && is_numeric($venue['longitude'] ?? null);
        $profiles = array_values(array_filter([
            $venue['facebook'] ?? null,
            $venue['instagram'] ?? null,
            $venue['youtube'] ?? null,
        ]));

        return array_filter([
            '@context' => 'https://schema.org',
            '@type' => 'SportsActivityLocation',
            'name' => $name,
            'description' => $description,
            'url' => url('/'),
            'image' => asset('logos.png'),
            'telephone' => $venue['phone'] ?? null,
            'email' => $venue['email'] ?? null,
            // Only a street-less country would be left otherwise; that says nothing about where we are.
            'address' => count($address) > 2 ? $address : null,
            'geo' => $hasCoordinates ? [
                '@type' => 'GeoCoordinates',
                'latitude' => (float) $venue['latitude'],
                'longitude' => (float) $venue['longitude'],
            ] : null,
            'sameAs' => $profiles ?: null,
        ]);
    }

    /**
     * @param  list<mixed>  $parts
     */
    private function join(array $parts): ?string
    {
        $parts = array_filter(array_map(fn ($part) => is_string($part) ? trim($part) : null, $parts));

        return $parts ? implode(', ', $parts) : null;
    }
}
