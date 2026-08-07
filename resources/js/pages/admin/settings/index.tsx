import { Head, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

import InputError from '@/components/input-error';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { index as adminSettingsIndex, update } from '@/routes/admin/settings';
import type { Setting } from '@/types/booking';

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

type Props = {
    settings: Record<string, Setting[]>;
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
    return Array.isArray(value) && value.every((item) => typeof item === 'string');
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
                    const wide = isPlainObject(val) || isStringArray(val) || (typeof val === 'string' && val.length > 80);

                    return (
                        <div key={key} className={wide ? 'grid gap-2 sm:col-span-2' : 'grid gap-2'}>
                            <Label htmlFor={fieldId}>{humanize(key)}</Label>
                            {isPlainObject(val) ? (
                                <div className="rounded-lg border p-3">
                                    <SettingValueEditor
                                        value={val}
                                        onChange={(next) => onChange({ ...value, [key]: next })}
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
                            ) : key === 'description' || (typeof val === 'string' && val.length > 80) ? (
                                <Textarea
                                    id={fieldId}
                                    value={val === null || val === undefined ? '' : String(val)}
                                    onChange={(e) => onChange({ ...value, [key]: e.target.value })}
                                    rows={4}
                                />
                            ) : (
                                <Input
                                    id={fieldId}
                                    type={key === 'open' || key === 'close' ? 'time' : 'text'}
                                    value={val === null || val === undefined ? '' : String(val)}
                                    onChange={(e) => onChange({ ...value, [key]: e.target.value })}
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

export default function AdminSettingsIndex({ settings }: Props) {
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

    const submit = (event: FormEvent) => {
        event.preventDefault();
        put(update().url);
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

                <form onSubmit={submit} className="mx-auto w-full max-w-3xl space-y-6">
                    {Object.entries(settings).map(([group, items]) => (
                        <Card key={group}>
                            <CardHeader>
                                <CardTitle className="capitalize">
                                    {group.replace(/_/g, ' ')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-6">
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
                                        <div key={setting.id} className="grid gap-2">
                                            <Label htmlFor={`${group}-${setting.key}`}>
                                                {humanize(setting.key)}
                                            </Label>
                                            <SettingValueEditor
                                                value={value}
                                                idPrefix={`${group}-${setting.key}`}
                                                onChange={(next) => {
                                                    if (index >= 0) {
                                                        updateSetting(index, next);
                                                    }
                                                }}
                                            />
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    ))}

                    {!Object.keys(settings).length ? (
                        <Card>
                            <CardContent className="grid gap-4 pt-6">
                                <div className="grid gap-2">
                                    <Label>Site name</Label>
                                    <Input
                                        value={String(data.settings[0]?.value ?? '')}
                                        onChange={(e) =>
                                            updateSetting(0, e.target.value)
                                        }
                                    />
                                </div>
                                <p className="text-muted-foreground text-sm">
                                    No settings configured yet. Save to create defaults.
                                </p>
                            </CardContent>
                        </Card>
                    ) : null}

                    <InputError message={errors.settings as string} />

                    <div className="flex justify-end">
                        <Button type="submit" disabled={processing}>
                            Save settings
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
