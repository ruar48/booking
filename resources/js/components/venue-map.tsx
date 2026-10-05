import { ExternalLink, MapPin, Navigation } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { VenueProfile } from '@/types/booking';

export function venueAddress(venue: VenueProfile): string {
    return [venue.address_line_1, venue.city, venue.state, venue.postal_code]
        .filter(Boolean)
        .join(', ');
}

/**
 * Where the venue is, with a link out to the route.
 *
 * The inline map only shows the pin (Google's keyless embed, so there is no API
 * key to manage). "Get directions" opens Google Maps in a new tab, which starts
 * the route from the visitor's own location and offers driving, transit and
 * walking — far more usable than a route squeezed into a card.
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

    if (!address) {
        return null;
    }

    // An exact pin beats geocoding the address, which can land on the wrong
    // spot for rural barangays.
    const hasPin =
        String(venue.latitude ?? '').trim() !== '' &&
        String(venue.longitude ?? '').trim() !== '';
    const destination = encodeURIComponent(
        hasPin ? `${venue.latitude},${venue.longitude}` : address,
    );
    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    const embedUrl = `https://maps.google.com/maps?q=${destination}&z=15&output=embed`;

    return (
        <div className={cn('space-y-3', className)}>
            <div className="flex flex-wrap items-start justify-between gap-3">
                <p className="flex items-start gap-2 text-sm">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-brand-court" />
                    <span>{address}</span>
                </p>
                <Button size="sm" asChild>
                    <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
                        <Navigation className="size-4" />
                        Get directions
                        <ExternalLink className="size-3.5" />
                    </a>
                </Button>
            </div>
            <iframe
                title={`Map of ${address}`}
                src={embedUrl}
                className={cn('h-64 w-full rounded-lg border-0 sm:h-80', mapClassName)}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
            />
        </div>
    );
}
