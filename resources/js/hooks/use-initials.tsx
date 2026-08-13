import { useCallback } from 'react';

export type GetInitialsFn = (fullName: string) => string;
export type GetAvatarFallbackFn = (fullName: string, gender?: string | null) => string;

function getInitial(name: string): string {
    return Array.from(name)[0] ?? '';
}

export function useInitials(): GetInitialsFn {
    return useCallback((fullName: string): string => {
        const names = fullName.trim().split(/\s+/u).filter(Boolean);

        if (names.length === 0) {
            return '';
        }

        if (names.length === 1) {
            return getInitial(names[0]).toUpperCase();
        }

        const firstInitial = getInitial(names[0]);
        const lastInitial = getInitial(names[names.length - 1]);

        return `${firstInitial}${lastInitial}`.toUpperCase();
    }, []);
}

/**
 * Avatar fallback text: "M"/"F" when the person's gender is known, otherwise
 * falls back to name initials.
 */
export function useAvatarFallback(): GetAvatarFallbackFn {
    const getInitials = useInitials();

    return useCallback(
        (fullName: string, gender?: string | null): string => {
            if (gender === 'male') return 'M';
            if (gender === 'female') return 'F';

            return getInitials(fullName);
        },
        [getInitials],
    );
}
