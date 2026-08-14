import { Link, router, usePage } from '@inertiajs/react';
import { Bell, Check, Inbox, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { formatRelative } from '@/lib/format';
import { getCsrfToken } from '@/lib/csrf';
import { getNotificationMeta, getNotificationToneClasses, type NotificationRecord } from '@/lib/notification-meta';
import { cn } from '@/lib/utils';

async function apiRequest(url: string, method: 'POST' | 'DELETE'): Promise<void> {
    await fetch(url, {
        method,
        headers: {
            Accept: 'application/json',
            'X-XSRF-TOKEN': getCsrfToken(),
        },
        credentials: 'same-origin',
    });
}

export function NotificationsDropdown() {
    const { notificationsCount } = usePage().props;

    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [notifications, setNotifications] = useState<NotificationRecord[]>([]);

    useEffect(() => {
        if (!open || loaded) {
            return;
        }

        setLoading(true);

        fetch('/notifications', { headers: { Accept: 'application/json' }, credentials: 'same-origin' })
            .then((response) => (response.ok ? response.json() : { notifications: [] }))
            .then((payload: { notifications: NotificationRecord[] }) => {
                setNotifications(payload.notifications ?? []);
                setLoaded(true);
            })
            .finally(() => setLoading(false));
    }, [open, loaded]);

    const syncCount = () => router.reload({ only: ['notificationsCount'] });

    const markAsRead = (notification: NotificationRecord) => {
        if (notification.read_at) {
            return;
        }

        setNotifications((prev) =>
            prev.map((item) => (item.id === notification.id ? { ...item, read_at: new Date().toISOString() } : item)),
        );

        apiRequest(`/notifications/${notification.id}/read`, 'POST').then(syncCount);
    };

    const markAllAsRead = () => {
        setNotifications((prev) => prev.map((item) => (item.read_at ? item : { ...item, read_at: new Date().toISOString() })));

        apiRequest('/notifications/read-all', 'POST').then(syncCount);
    };

    const dismiss = (notification: NotificationRecord) => {
        setNotifications((prev) => prev.filter((item) => item.id !== notification.id));

        apiRequest(`/notifications/${notification.id}`, 'DELETE').then(syncCount);
    };

    const unreadCount = typeof notificationsCount === 'number' ? notificationsCount : 0;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative shrink-0" aria-label="Notifications">
                    <Bell className="size-4" />
                    {unreadCount > 0 ? (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full p-0 text-[10px]"
                        >
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                    ) : null}
                </Button>
            </PopoverTrigger>

            <PopoverContent align="end" className="w-90 p-0">
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <p className="text-sm font-semibold">Notifications</p>
                    {notifications.some((n) => !n.read_at) ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                            onClick={markAllAsRead}
                        >
                            <Check className="size-3.5" />
                            Mark all read
                        </Button>
                    ) : null}
                </div>

                <div className="max-h-96 overflow-y-auto">
                    {loading ? (
                        <div className="space-y-3 p-4">
                            {Array.from({ length: 3 }).map((_, index) => (
                                <div key={index} className="flex items-start gap-3">
                                    <Skeleton className="size-9 shrink-0 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-3.5 w-3/4" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                            <Inbox className="size-8 text-muted-foreground/50" />
                            <p className="text-sm text-muted-foreground">You're all caught up.</p>
                        </div>
                    ) : (
                        <ul className="divide-y">
                            {notifications.map((notification) => {
                                const meta = getNotificationMeta(notification.type);
                                const Icon = meta.icon;
                                const href = meta.href(notification.data);
                                const description = meta.description(notification.data);
                                const isUnread = !notification.read_at;

                                const body = (
                                    <div
                                        className={cn(
                                            'group relative flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50',
                                            isUnread && 'bg-primary/5',
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                'flex size-9 shrink-0 items-center justify-center rounded-full',
                                                getNotificationToneClasses(notification.type),
                                            )}
                                        >
                                            <Icon className="size-4" />
                                        </span>

                                        <div className="min-w-0 flex-1">
                                            <p className={cn('text-sm leading-snug', isUnread ? 'font-medium' : 'text-muted-foreground')}>
                                                {meta.title(notification.data)}
                                            </p>
                                            {description ? (
                                                <p className="mt-0.5 truncate text-xs text-muted-foreground" title={description}>
                                                    {description}
                                                </p>
                                            ) : null}
                                            <p className="mt-0.5 text-xs text-muted-foreground/70">{formatRelative(notification.created_at)}</p>
                                        </div>

                                        {isUnread ? <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" /> : null}

                                        <button
                                            type="button"
                                            aria-label="Dismiss notification"
                                            className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground group-hover:opacity-100"
                                            onClick={(event) => {
                                                event.preventDefault();
                                                event.stopPropagation();
                                                dismiss(notification);
                                            }}
                                        >
                                            <X className="size-3.5" />
                                        </button>
                                    </div>
                                );

                                return (
                                    <li key={notification.id}>
                                        {href ? (
                                            <Link href={href} onClick={() => markAsRead(notification)}>
                                                {body}
                                            </Link>
                                        ) : (
                                            <button type="button" className="block w-full" onClick={() => markAsRead(notification)}>
                                                {body}
                                            </button>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
