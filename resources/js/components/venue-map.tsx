import { ExternalLink, MapPin, Navigation } from 'lucide-react';
import { useState, useSyncExternalStore } from 'react';

import { Button } from '@/components/ui/button';
import { hasConsent, subscribeToConsent } from '@/lib/cookie-consent';
import { cn } from '@/lib/utils';
import type { VenueProfile } from '@/types/booking';

/**
 * Google's keyless map embed, held back until the visitor allows it: loading
 * it lets Google set its own cookies and see the visitor's IP address. It
 * loads by itself once "Preferences" are allowed, otherwise on a click.
 */
export function GoogleMapEmbed({ src, title, className }: { src: string; title: string; className?: string }) {
    const allowed = useSyncExternalStore(subscribeToConsent, () => hasConsent('preferences'), () => false);
    const [requested, setRequested] = useState(false);

    if (allowed || requested) {
        return (
            <iframe
                title={title}
                src={src}
                className={className}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
            />
        );
    }

    return (
        <div
            className={cn(
                className,
                'flex flex-col items-center justify-center gap-1 bg-slate-100 p-4 text-center text-slate-600',
            )}
        >
            <MapPin className="size-5 text-brand-court" />
            <p className="text-xs font-semibold text-slate-700">Map by Google</p>
            <p className="max-w-64 text-[11px] leading-snug">
                Showing it lets Google set cookies and see your IP address.
            </p>
            <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-1 h-8 border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
                onClick={() => setRequested(true)}
            >
                Show map
            </Button>
        </div>
    );
}

export function venueAddress(venue: VenueProfile): string {
    return [venue.address_line_1, venue.city, venue.state, venue.postal_code]
        .filter(Boolean)
        .join(', ');
}

export function venueMapUrls(
    venue: VenueProfile,
): { address: string; directionsUrl: string; embedUrl: string } | null {
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

    return {
        address,
        directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${destination}`,
        embedUrl: `https://maps.google.com/maps?q=${destination}&z=15&output=embed`,
    };
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
    const urls = venueMapUrls(venue);

    if (!urls) {
        return null;
    }

    const { address, directionsUrl, embedUrl } = urls;

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
            <GoogleMapEmbed
                title={`Map of ${address}`}
                src={embedUrl}
                className={cn('h-64 w-full rounded-lg border-0 sm:h-80', mapClassName)}
            />
        </div>
    );
}
