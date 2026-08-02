import { usePage } from '@inertiajs/react';

export function useIsVenueAdmin(): boolean {
    const { auth } = usePage().props;

    return auth.user?.isVenueAdmin === true;
}
