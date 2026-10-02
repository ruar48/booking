import { ExternalLink, MapPin, Navigation } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { VenueProfile } from '@/types/booking';

export function venueAddress(venue: VenueProfile): string {
    return [venue.address_line_1, venue.city, venue.state, venue.postal_code]
        .filter(Boolean)
        .join(', ');
}

/**
 * Where the venue is, with a route to it on request.
 *
 * Uses Google's keyless embed, so there is no API key to manage. The visitor's
 * location is only asked for when they press "Get directions"; if they refuse
 * (or the browser can't tell), Google Maps opens in a new tab and works out the
 * route from there instead.
 */
export function VenueMap({
    venue,
    className,
    mapClassName,
}: {
    venue: VenueProfile;
    className?: string;
    mapClassName?: string;
}) {
    const address = venueAddress(venue);
    const [origin, setOrigin] = useState<string | null>(null);
    const [locating, setLocating] = useState(false);

    if (!address) {
        return null;
    }

    const destination = encodeURIComponent(address);
    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    const embedUrl = origin
        ? `https://maps.google.com/maps?saddr=${encodeURIComponent(origin)}&daddr=${destination}&output=embed`
        : `https://maps.google.com/maps?q=${destination}&z=15&output=embed`;

    const showDirections = () => {
        if (!('geolocation' in navigator)) {
            window.open(directionsUrl, '_blank', 'noopener');

            return;
        }

        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
                setOrigin(`${coords.latitude},${coords.longitude}`);
                setLocating(false);
            },
            () => {
                setLocating(false);
                window.open(directionsUrl, '_blank', 'noopener');
            },
            { timeout: 10000 },
        );
    };

    return (
        <div className={cn('space-y-3', className)}>
            <div className="flex flex-wrap items-start justify-between gap-3">
                <p className="flex items-start gap-2 text-sm">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-brand-court" />
                    <span>{address}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                    <Button
                        size="sm"
                        onClick={showDirections}
                        disabled={locating}
                    >
                        <Navigation className="size-4" />
                        {locating
                            ? 'Locating…'
                            : origin
                              ? 'Refresh route'
                              : 'Get directions'}
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                        <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
                            Open in Maps
                            <ExternalLink className="size-3.5" />
                        </a>
                    </Button>
                </div>
            </div>
            <iframe
                key={embedUrl}
                title={`Map to ${address}`}
                src={embedUrl}
                className={cn('h-64 w-full rounded-lg border-0 sm:h-80', mapClassName)}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
            />
        </div>
    );
}
