import {
    Bell,
    CalendarCheck,
    CalendarClock,
    CalendarX,
    CreditCard,
    Megaphone,
    Swords,
    Trophy,
    XCircle,
    type LucideIcon,
} from 'lucide-react';

export type NotificationRecord = {
    id: string;
    type: string | null;
    data: Record<string, unknown>;
    read_at: string | null;
    created_at: string;
};

type NotificationMeta = {
    icon: LucideIcon;
    tone: 'default' | 'success' | 'warning' | 'danger';
    title: (data: Record<string, unknown>) => string;
    description: (data: Record<string, unknown>) => string | null;
    href: (data: Record<string, unknown>) => string | null;
};

function asString(value: unknown): string | null {
    return typeof value === 'string' && value.length > 0 ? value : null;
}

function customerLine(data: Record<string, unknown>): string | null {
    const name = asString(data.customer_name);
    const phone = asString(data.customer_phone);
    const email = asString(data.customer_email);

    if (!name) {
        return null;
    }

    return [name, phone, email].filter(Boolean).join(' · ');
}

const META: Record<string, NotificationMeta> = {
    booking_created: {
        icon: CalendarClock,
        tone: 'default',
        title: () => 'Booking submitted',
        description: (data) => customerLine(data),
        href: (data) => (data.booking_id ? `/bookings/${data.booking_id}` : null),
    },
    booking_approved: {
        icon: CalendarCheck,
        tone: 'success',
        title: () => 'Booking approved',
        description: (data) => customerLine(data),
        href: (data) => (data.booking_id ? `/bookings/${data.booking_id}` : null),
    },
    booking_cancelled: {
        icon: CalendarX,
        tone: 'danger',
        title: () => 'Booking cancelled',
        description: (data) => {
            const reason = asString(data.cancellation_reason);
            const customer = customerLine(data);

            return [customer, reason].filter(Boolean).join(' — ') || null;
        },
        href: (data) => (data.booking_id ? `/bookings/${data.booking_id}` : null),
    },
    booking_reminder: {
        icon: CalendarClock,
        tone: 'warning',
        title: () => 'Upcoming booking',
        description: (data) => customerLine(data),
        href: (data) => (data.booking_id ? `/bookings/${data.booking_id}` : null),
    },
    booking_failed: {
        icon: XCircle,
        tone: 'danger',
        title: () => 'Booking attempt failed',
        description: (data) => {
            const reason = asString(data.reason);
            const customer = customerLine(data);

            return [customer, reason].filter(Boolean).join(' — ') || null;
        },
        href: () => null,
    },
    payment_successful: {
        icon: CreditCard,
        tone: 'success',
        title: () => 'Payment received',
        description: () => null,
        href: () => null,
    },
    tournament_reminder: {
        icon: Trophy,
        tone: 'warning',
        title: (data) => `Tournament reminder${data.tournament_name ? `: ${data.tournament_name}` : ''}`,
        description: () => null,
        href: () => null,
    },
    match_reminder: {
        icon: Swords,
        tone: 'warning',
        title: () => 'Upcoming match',
        description: () => null,
        href: () => null,
    },
    announcement_published: {
        icon: Megaphone,
        tone: 'default',
        title: (data) => (typeof data.title === 'string' ? data.title : 'New announcement'),
        description: () => null,
        href: () => null,
    },
};

const DEFAULT_META: NotificationMeta = {
    icon: Bell,
    tone: 'default',
    title: () => 'Notification',
    description: () => null,
    href: () => null,
};

export function getNotificationMeta(type: string | null): NotificationMeta {
    return (type && META[type]) || DEFAULT_META;
}

const TONE_CLASSES: Record<NotificationMeta['tone'], string> = {
    default: 'bg-primary/10 text-primary',
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    danger: 'bg-destructive/10 text-destructive',
};

export function getNotificationToneClasses(type: string | null): string {
    return TONE_CLASSES[getNotificationMeta(type).tone];
}
