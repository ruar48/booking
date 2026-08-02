import { usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

import type { FlashToast as FlashToastType } from '@/types/ui';

export function FlashToast() {
    const { flash } = usePage().props;
    const lastToast = useRef<string | null>(null);

    useEffect(() => {
        const data = flash?.toast as FlashToastType | undefined | null;

        if (!data?.message) {
            return;
        }

        const key = `${data.type}:${data.message}`;

        if (lastToast.current === key) {
            return;
        }

        lastToast.current = key;
        toast[data.type](data.message);
    }, [flash]);

    return null;
}
