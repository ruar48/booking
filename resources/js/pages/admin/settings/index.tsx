import { Head, useForm } from '@inertiajs/react';
import { Bell, SlidersHorizontal, Timer } from 'lucide-react';
import type { FormEvent } from 'react';

import { FormSection } from '@/components/form-section';
import InputError from '@/components/input-error';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
    index as adminSettingsIndex,
    update,
    updateNotifications,
    updatePaymentWindow,
} from '@/routes/admin/settings';
import type { Setting } from '@/types/booking';

type NotificationSetting = {
    key: string;
    enabled: boolean;
    recipients: string[];
};

const NOTIFICATION_EVENT_LABELS: Record<string, string> = {
    booking_created: 'Booking created',
    booking_failed: 'Booking failed',
    booking_approved: 'Booking approved',
    booking_cancelled: 'Booking cancelled',
    payment_successful: 'Payment received',
};

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

type Props = {
    settings: Record<string, Setting[]>;
    unpaidCancelMinutes: number | null;
    notificationSettings: NotificationSetting[];
};

function humanize(key: string): string {
    return key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function isPlainObject(value: unknown): value is Record<string, JsonValue> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
    return (
        Array.isArray(value) && value.every((item) => typeof item === 'string')
    );
}

function toEditableValue(value: unknown): JsonValue {
    if (value === undefined) {
        return '';
    }

    return value as JsonValue;
}

function SettingValueEditor({
    value,
    onChange,
    idPrefix,
}: {
    value: JsonValue;
    onChange: (value: JsonValue) => void;
    idPrefix: string;
}) {
    if (isPlainObject(value)) {
        return (
            <div className="grid gap-4 sm:grid-cols-2">
                {Object.entries(value).map(([key, val]) => {
                    const fieldId = `${idPrefix}-${key}`;
                    const wide =
                        isPlainObject(val) ||
                        isStringArray(val) ||
                        (typeof val === 'string' && val.length > 80);

                    return (
                        <div
                            key={key}
                            className={
                                wide ? 'grid gap-2 sm:col-span-2' : 'grid gap-2'
                            }
                        >
                            <Label htmlFor={fieldId}>{humanize(key)}</Label>
                            {isPlainObject(val) ? (
                                <div className="rounded-lg border p-3">
                                    <SettingValueEditor
                                        value={val}
                                        onChange={(next) =>
                                            onChange({ ...value, [key]: next })
                                        }
                                        idPrefix={fieldId}
                                    />
                                </div>
                            ) : isStringArray(val) ? (
                                <Input
                                    id={fieldId}
                                    value={val.join(', ')}
                                    placeholder="Comma-separated list"
                                    onChange={(e) =>
                                        onChange({
                                            ...value,
                                            [key]: e.target.value
                                                .split(',')
                                                .map((item) => item.trim())
                                                .filter(Boolean),
                                        })
                                    }
                                />
                            ) : key === 'description' ||
                              (typeof val === 'string' && val.length > 80) ? (
                                <Textarea
                                    id={fieldId}
                                    value={
                                        val === null || val === undefined
                                            ? ''
                                            : String(val)
                                    }
                                    onChange={(e) =>
                                        onChange({
                                            ...value,
                                            [key]: e.target.value,
                                        })
                                    }
                                    rows={4}
                                />
                            ) : (
                                <Input
                                    id={fieldId}
                                    type={
                                        key === 'open' || key === 'close'
                                            ? 'time'
                                            : 'text'
                                    }
                                    value={
                                        val === null || val === undefined
                                            ? ''
                                            : String(val)
                                    }
                                    onChange={(e) =>
                                        onChange({
                                            ...value,
                                            [key]: e.target.value,
                                        })
                                    }
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <Input
            id={idPrefix}
            value={value === null || value === undefined ? '' : String(value)}
            onChange={(e) => onChange(e.target.value)}
        />
    );
}

export default function AdminSettingsIndex({
    settings,
    unpaidCancelMinutes,
    notificationSettings,
}: Props) {
    const flatSettings = Object.entries(settings).flatMap(([group, items]) =>
        items.map((setting) => ({
            group,
            key: setting.key,
            value: toEditableValue(setting.value),
        })),
    );

    const { data, setData, put, processing, errors } = useForm<{
        settings: { group: string; key: string; value: any }[];
    }>({
        settings: flatSettings.length
            ? flatSettings
            : [{ group: 'general', key: 'site_name', value: '' }],
    });

    const paymentWindowForm = useForm({
        minutes:
            unpaidCancelMinutes !== null ? String(unpaidCancelMinutes) : '',
    });

    const notificationsForm = useForm<{ notifications: NotificationSetting[] }>(
        {
            notifications: notificationSettings,
        },
    );

    const submit = (event: FormEvent) => {
        event.preventDefault();
        put(update().url);
    };

    const submitPaymentWindow = (event: FormEvent) => {
        event.preventDefault();
        paymentWindowForm.transform((data) => ({
            minutes: data.minutes ? Number(data.minutes) : null,
        }));
        paymentWindowForm.put(updatePaymentWindow().url, {
            preserveScroll: true,
        });
    };

    const submitNotifications = (event: FormEvent) => {
        event.preventDefault();
        notificationsForm.put(updateNotifications().url, {
            preserveScroll: true,
        });
    };

    const updateNotificationSetting = (
        key: string,
        changes: Partial<NotificationSetting>,
    ) => {
        notificationsForm.setData(
            'notifications',
            notificationsForm.data.notifications.map((notification) =>
                notification.key === key
                    ? { ...notification, ...changes }
                    : notification,
            ),
        );
    };

    const toggleNotificationRecipient = (
        key: string,
        recipient: string,
        checked: boolean,
    ) => {
        const notification = notificationsForm.data.notifications.find(
            (n) => n.key === key,
        );

        if (!notification) {
            return;
        }

        const recipients = checked
            ? [...notification.recipients, recipient]
            : notification.recipients.filter((r) => r !== recipient);

        updateNotificationSetting(key, { recipients });
    };

    const updateSetting = (index: number, value: JsonValue) => {
        const next = [...data.settings];
        next[index] = { ...next[index], value };
        setData('settings', next);
    };

    return (
        <>
            <Head title="Venue Settings" />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <PageHeader
                    title="Venue settings"
                    description="Manage your pickleball court booking preferences"
                />

                <div className="grid gap-6 xl:grid-cols-3">
                    {/* Notifications is by far the tallest section, so it leads
                        the main column and the short payment window sits beside
                        it rather than above a mostly-empty row. */}
                    <form
                        onSubmit={submitNotifications}
                        className="space-y-4 xl:col-span-2"
                    >
                        <FormSection
                            icon={Bell}
                            tone="violet"
                            title="Booking notifications"
                            description="Choose which booking emails are sent, and who receives them. Admins are notified as the venue's owners."
                            contentClassName="grid gap-3 px-5 pb-5 sm:grid-cols-1"
                        >
                            {notificationsForm.data.notifications.map(
                                (notification) => (
                                    <div
                                        key={notification.key}
                                        className={cn(
                                            'grid gap-3 rounded-lg border p-4 transition-colors',
                                            notification.enabled
                                                ? 'bg-card'
                                                : 'bg-muted/40',
                                        )}
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <Label
                                                htmlFor={`notif-${notification.key}-enabled`}
                                                className="text-sm font-medium"
                                            >
                                                {NOTIFICATION_EVENT_LABELS[
                                                    notification.key
                                                ] ?? notification.key}
                                            </Label>
                                            <Switch
                                                id={`notif-${notification.key}-enabled`}
                                                checked={notification.enabled}
                                                onCheckedChange={(checked) =>
                                                    updateNotificationSetting(
                                                        notification.key,
                                                        { enabled: checked },
                                                    )
                                                }
                                            />
                                        </div>
                                        <div
                                            className={cn(
                                                'flex flex-wrap gap-x-5 gap-y-2 transition-opacity',
                                                notification.enabled
                                                    ? 'opacity-100'
                                                    : 'opacity-50',
                                            )}
                                        >
                                            <label className="flex items-center gap-2 text-sm">
                                                <Checkbox
                                                    checked={notification.recipients.includes(
                                                        'customer',
                                                    )}
                                                    disabled={
                                                        !notification.enabled
                                                    }
                                                    onCheckedChange={(
                                                        checked,
                                                    ) =>
                                                        toggleNotificationRecipient(
                                                            notification.key,
                                                            'customer',
                                                            checked === true,
                                                        )
                                                    }
                                                />
                                                Notify customer
                                            </label>
                                            <label className="flex items-center gap-2 text-sm">
                                                <Checkbox
                                                    checked={notification.recipients.includes(
                                                        'owners',
                                                    )}
                                                    disabled={
                                                        !notification.enabled
                                                    }
                                                    onCheckedChange={(
                                                        checked,
                                                    ) =>
                                                        toggleNotificationRecipient(
                                                            notification.key,
                                                            'owners',
                                                            checked === true,
                                                        )
                                                    }
                                                />
                                                Notify admins (owners)
                                            </label>
                                        </div>
                                    </div>
                                ),
                            )}
                        </FormSection>
                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                disabled={notificationsForm.processing}
                            >
                                {notificationsForm.processing
                                    ? 'Saving…'
                                    : 'Save notifications'}
                            </Button>
                        </div>
                    </form>

                    <form onSubmit={submitPaymentWindow} className="space-y-4">
                        <FormSection
                            icon={Timer}
                            tone="amber"
                            title="Payment window"
                            description="Automatically cancel a booking if payment isn't received within this many minutes. Leave blank to allow unlimited time to pay."
                            contentClassName="grid gap-4 px-5 pb-5 sm:grid-cols-1"
                        >
                            <div className="grid gap-2">
                                <Label htmlFor="unpaid-cancel-minutes">
                                    Minutes before auto-cancel
                                </Label>
                                <Input
                                    id="unpaid-cancel-minutes"
                                    type="number"
                                    min={1}
                                    placeholder="No limit"
                                    value={paymentWindowForm.data.minutes}
                                    onChange={(e) =>
                                        paymentWindowForm.setData(
                                            'minutes',
                                            e.target.value,
                                        )
                                    }
                                />
                                <InputError
                                    message={paymentWindowForm.errors.minutes}
                                />
                            </div>
                        </FormSection>
                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                disabled={paymentWindowForm.processing}
                            >
                                {paymentWindowForm.processing
                                    ? 'Saving…'
                                    : 'Save payment window'}
                            </Button>
                        </div>
                    </form>
                </div>

                <form onSubmit={submit} className="space-y-4">
                    {Object.entries(settings).map(([group, items]) => (
                        <FormSection
                            key={group}
                            icon={SlidersHorizontal}
                            tone="blue"
                            title={
                                group
                                    .replace(/_/g, ' ')
                                    .charAt(0)
                                    .toUpperCase() +
                                group.replace(/_/g, ' ').slice(1)
                            }
                            contentClassName="grid gap-6 px-5 pb-5 sm:grid-cols-1"
                        >
                            <>
                                {items.map((setting) => {
                                    const index = data.settings.findIndex(
                                        (s) =>
                                            s.group === group &&
                                            s.key === setting.key,
                                    );
                                    const value = toEditableValue(
                                        index >= 0
                                            ? data.settings[index].value
                                            : setting.value,
                                    );

                                    return (
                                        <div
                                            key={setting.id}
                                            className="grid gap-2"
                                        >
                                            <Label
                                                htmlFor={`${group}-${setting.key}`}
                                            >
                                                {humanize(setting.key)}
                                            </Label>
                                            <SettingValueEditor
                                                value={value}
                                                idPrefix={`${group}-${setting.key}`}
                                                onChange={(next) => {
                                                    if (index >= 0) {
                                                        updateSetting(
                                                            index,
                                                            next,
                                                        );
                                                    }
                                                }}
                                            />
                                        </div>
                                    );
                                })}
                            </>
                        </FormSection>
                    ))}

                    {!Object.keys(settings).length ? (
                        <FormSection
                            icon={SlidersHorizontal}
                            tone="blue"
                            title="General"
                            description="No settings configured yet. Save to create defaults."
                            contentClassName="grid gap-4 px-5 pb-5 sm:grid-cols-1"
                        >
                            <div className="grid gap-2">
                                <Label>Site name</Label>
                                <Input
                                    value={String(
                                        data.settings[0]?.value ?? '',
                                    )}
                                    onChange={(e) =>
                                        updateSetting(0, e.target.value)
                                    }
                                />
                            </div>
                        </FormSection>
                    ) : null}

                    <InputError message={errors.settings as string} />

                    <div className="flex justify-end">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving…' : 'Save settings'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

AdminSettingsIndex.layout = {
    breadcrumbs: [{ title: 'Venue Settings', href: adminSettingsIndex() }],
};
