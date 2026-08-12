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
            const message =
                notification.message ??
                notification.type?.replace(/_/g, ' ') ??
                'New notification';

            toast.info(message.charAt(0).toUpperCase() + message.slice(1));
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
