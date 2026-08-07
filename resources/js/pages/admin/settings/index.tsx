import { Head, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

import InputError from '@/components/input-error';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { index as adminSettingsIndex, update } from '@/routes/admin/settings';
import type { Setting } from '@/types/booking';

type Props = {
    settings: Record<string, Setting[]>;
};

export default function AdminSettingsIndex({ settings }: Props) {
    const flatSettings = Object.entries(settings).flatMap(([group, items]) =>
        items.map((setting) => ({
            group,
            key: setting.key,
            value:
                typeof setting.value === 'string'
                    ? setting.value
                    : JSON.stringify(setting.value ?? ''),
        })),
    );

    const { data, setData, put, processing, errors } = useForm({
        settings: flatSettings.length
            ? flatSettings
            : [{ group: 'general', key: 'site_name', value: '' }],
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        put(update().url);
    };

    const updateSetting = (index: number, value: string) => {
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
                            <CardContent className="grid gap-4">
                                {items.map((setting) => {
                                    const index = data.settings.findIndex(
                                        (s) =>
                                            s.group === group &&
                                            s.key === setting.key,
                                    );
                                    const value =
                                        index >= 0
                                            ? data.settings[index].value
                                            : String(setting.value ?? '');

                                    return (
                                        <div key={setting.id} className="grid gap-2">
                                            <Label htmlFor={`${group}-${setting.key}`}>
                                                {setting.key.replace(/_/g, ' ')}
                                            </Label>
                                            <Input
                                                id={`${group}-${setting.key}`}
                                                value={value}
                                                onChange={(e) => {
                                                    if (index >= 0) {
                                                        updateSetting(
                                                            index,
                                                            e.target.value,
                                                        );
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
                                        value={data.settings[0]?.value ?? ''}
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
