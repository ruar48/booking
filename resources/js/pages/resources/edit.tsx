import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

import InputError from '@/components/input-error';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { index as resourcesIndex, update } from '@/routes/resources';
import type { Resource } from '@/types/booking';

type Props = {
    resource: Resource;
};

export default function ResourcesEdit({ resource }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        sport: resource.sport,
        name: resource.name,
        resource_number: resource.resource_number,
        surface_type: resource.surface_type,
        location_type: resource.location_type,
        has_lighting: resource.has_lighting,
        hourly_rate: resource.hourly_rate,
        status: resource.status,
        description: resource.description ?? '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        put(update(resource).url);
    };

    const isPickleball = data.sport === 'pickleball';

    return (
        <>
            <Head title={`Edit ${resource.name}`} />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <PageHeader
                    title={`Edit ${resource.name}`}
                    description="Update rates, sport, and availability"
                />
                <form onSubmit={submit} className="mx-auto w-full max-w-2xl space-y-6">
                    {Object.keys(errors).length > 0 && (
                        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                            <p className="font-medium">Please fix the following before saving:</p>
                            <ul className="mt-1 list-inside list-disc">
                                {Object.entries(errors).map(([field, message]) => (
                                    <li key={field}>{message}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <Card>
                        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                />
                                <InputError message={errors.name} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Sport</Label>
                                <Select
                                    value={data.sport}
                                    onValueChange={(v) =>
                                        setData('sport', v as 'pickleball' | 'billiards')
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pickleball">Pickleball</SelectItem>
                                        <SelectItem value="billiards">Billiards</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.sport} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="resource_number">Resource number</Label>
                                <Input
                                    id="resource_number"
                                    value={data.resource_number}
                                    onChange={(e) => setData('resource_number', e.target.value)}
                                    required
                                />
                                <InputError message={errors.resource_number} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="hourly_rate">Hourly rate</Label>
                                <Input
                                    id="hourly_rate"
                                    type="number"
                                    step="0.01"
                                    value={data.hourly_rate}
                                    onChange={(e) =>
                                        setData('hourly_rate', Number(e.target.value))
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Status</Label>
                                <Select
                                    value={data.status}
                                    onValueChange={(v) => setData('status', v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="available">Available</SelectItem>
                                        <SelectItem value="maintenance">Maintenance</SelectItem>
                                        <SelectItem value="unavailable">Unavailable</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {isPickleball && (
                                <>
                                    <div className="grid gap-2">
                                        <Label>Surface</Label>
                                        <Select
                                            value={data.surface_type}
                                            onValueChange={(v) => setData('surface_type', v)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="hard">Hard</SelectItem>
                                                <SelectItem value="clay">Clay</SelectItem>
                                                <SelectItem value="grass">Grass</SelectItem>
                                                <SelectItem value="carpet">Carpet</SelectItem>
                                                <SelectItem value="synthetic">Synthetic</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Location</Label>
                                        <Select
                                            value={data.location_type}
                                            onValueChange={(v) => setData('location_type', v)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="indoor">Indoor</SelectItem>
                                                <SelectItem value="outdoor">Outdoor</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-center gap-2 sm:col-span-2">
                                        <Checkbox
                                            id="has_lighting"
                                            checked={data.has_lighting}
                                            onCheckedChange={(checked) =>
                                                setData('has_lighting', checked === true)
                                            }
                                        />
                                        <Label htmlFor="has_lighting">Has lighting</Label>
                                    </div>
                                </>
                            )}
                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </CardContent>
                    </Card>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" asChild>
                            <Link href={resourcesIndex()}>Back</Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            Save changes
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

ResourcesEdit.layout = {
    breadcrumbs: [
        { title: 'Resources', href: resourcesIndex() },
        { title: 'Edit', href: resourcesIndex() },
    ],
};
