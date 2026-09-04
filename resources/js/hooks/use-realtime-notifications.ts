import { router, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';

import { initEcho } from '@/lib/echo';

type NotificationPayload = {
    type?: string;
    message?: string;
    [key: string]: unknown;
};

export function useRealtimeNotifications(): void {
    const { auth } = usePage().props;
    const userId = auth.user?.id;

    useEffect(() => {
        if (!userId) {
            return;
        }

        const echo = initEcho();

        if (!echo) {
            return;
        }

        const channel = echo.private(`App.Models.User.${userId}`);

        channel.notification((notification: NotificationPayload) => {
            // Only surface a toast when the notification carries real copy.
            // The previous fallback printed `notification.type`, which is the
            // fully-qualified PHP class name — the bell badge and dropdown
            // already present these properly, so a nameless one needs no toast.
            if (notification.message) {
                const message = notification.message;

                toast.info(message.charAt(0).toUpperCase() + message.slice(1));
            }

            router.reload({ only: ['notificationsCount'] });
        });

        return () => {
            channel.stopListening(
                '.Illuminate\\Notifications\\Events\\BroadcastNotificationCreated',
            );
            echo.leave(`private-App.Models.User.${userId}`);
        };
    }, [userId]);
}
