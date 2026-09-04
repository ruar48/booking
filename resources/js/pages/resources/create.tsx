import { Head, Link, useForm } from '@inertiajs/react';
import {
    CircleDollarSign,
    Info,
    Lightbulb,
    MapPin,
    SlidersHorizontal,
} from 'lucide-react';
import { FormEvent } from 'react';

import { FormSection } from '@/components/form-section';
import InputError from '@/components/input-error';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
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
import { index as resourcesIndex, store } from '@/routes/resources';
import type { SelectOption } from '@/types/booking';

type Props = {
    surfaceTypes?: SelectOption[];
};

export default function ResourcesCreate({ surfaceTypes = [] }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        sport: 'pickleball' as 'pickleball' | 'billiards',
        name: '',
        resource_number: '',
        // Matches the seeded courts; the full list comes from SurfaceType.
        surface_type: 'acrylic',
        location_type: 'indoor',
        has_lighting: false,
        hourly_rate: 0,
        status: 'available',
        description: '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        post(store().url);
    };

    const isPickleball = data.sport === 'pickleball';

    return (
        <>
            <Head title="New resource" />
            <form onSubmit={submit} className="flex flex-1 flex-col gap-6 p-4">
                <PageHeader
                    title="New resource"
                    description="Add a bookable court or table"
                />

                {Object.keys(errors).length > 0 && (
                    <div className="border-destructive/50 bg-destructive/10 text-destructive rounded-lg border p-3 text-sm">
                        <p className="font-medium">
                            Please fix the following before saving:
                        </p>
                        <ul className="mt-1 list-inside list-disc">
                            {Object.entries(errors).map(([field, message]) => (
                                <li key={field}>{message}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="grid gap-6 xl:grid-cols-3">
                    <div className="space-y-6 xl:col-span-2">
                        <FormSection
                            icon={Info}
                            tone="emerald"
                            title="Court details"
                            description="How this court is identified across the app."
                        >
                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Male Court"
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
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pickleball">
                                            Pickleball
                                        </SelectItem>
                                        <SelectItem value="billiards">
                                            Billiards
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.sport} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="resource_number">
                                    Resource number
                                </Label>
                                <Input
                                    id="resource_number"
                                    value={data.resource_number}
                                    onChange={(e) =>
                                        setData('resource_number', e.target.value)
                                    }
                                    placeholder="1"
                                    required
                                />
                                <InputError message={errors.resource_number} />
                            </div>
                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) =>
                                        setData('description', e.target.value)
                                    }
                                    rows={3}
                                />
                                <InputError message={errors.description} />
                            </div>
                        </FormSection>

                        {isPickleball && (
                            <FormSection
                                icon={MapPin}
                                tone="blue"
                                title="Playing surface"
                                description="Shown to members when they browse courts."
                            >
                                <div className="grid gap-2">
                                    <Label>Surface</Label>
                                    <Select
                                        value={data.surface_type}
                                        onValueChange={(v) =>
                                            setData('surface_type', v)
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select a surface" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {surfaceTypes.map((option) => (
                                                <SelectItem
                                                    key={option.value}
                                                    value={option.value}
                                                >
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.surface_type} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Location</Label>
                                    <Select
                                        value={data.location_type}
                                        onValueChange={(v) =>
                                            setData('location_type', v)
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Indoor or outdoor" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="indoor">Indoor</SelectItem>
                                            <SelectItem value="outdoor">
                                                Outdoor
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.location_type} />
                                </div>
                                <label className="hover:bg-muted flex cursor-pointer items-center gap-2.5 rounded-lg border p-3 text-sm transition-colors sm:col-span-2">
                                    <Checkbox
                                        checked={data.has_lighting}
                                        onCheckedChange={(checked) =>
                                            setData('has_lighting', checked === true)
                                        }
                                    />
                                    <Lightbulb className="size-4 text-amber-500" />
                                    <span>
                                        Has lighting
                                        <span className="text-muted-foreground ml-1.5">
                                            — playable after dark
                                        </span>
                                    </span>
                                </label>
                            </FormSection>
                        )}
                    </div>

                    <div className="space-y-6">
                        <FormSection
                            icon={CircleDollarSign}
                            tone="emerald"
                            title="Rate"
                            contentClassName="grid gap-4 px-5 pb-5 sm:grid-cols-1"
                        >
                            <div className="grid gap-2">
                                <Label htmlFor="hourly_rate">
                                    Hourly rate (₱)
                                </Label>
                                <Input
                                    id="hourly_rate"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.hourly_rate}
                                    onChange={(e) =>
                                        setData('hourly_rate', Number(e.target.value))
                                    }
                                />
                                <InputError message={errors.hourly_rate} />
                            </div>
                        </FormSection>

                        <FormSection
                            icon={SlidersHorizontal}
                            tone="violet"
                            title="Availability"
                            description="Unavailable courts cannot be booked."
                            contentClassName="grid gap-4 px-5 pb-5 sm:grid-cols-1"
                        >
                            <div className="grid gap-2">
                                <Label>Status</Label>
                                <Select
                                    value={data.status}
                                    onValueChange={(v) => setData('status', v)}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="available">
                                            Available
                                        </SelectItem>
                                        <SelectItem value="maintenance">
                                            Maintenance
                                        </SelectItem>
                                        <SelectItem value="unavailable">
                                            Unavailable
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.status} />
                            </div>
                        </FormSection>
                    </div>
                </div>

                <div className="bg-background/95 supports-[backdrop-filter]:bg-background/75 sticky bottom-0 -mx-4 mt-auto flex items-center justify-end gap-2 border-t px-4 py-3 backdrop-blur">
                    <Button variant="outline" asChild>
                        <Link href={resourcesIndex()}>Cancel</Link>
                    </Button>
                    <Button type="submit" disabled={processing}>
                        {processing ? 'Creating…' : 'Create resource'}
                    </Button>
                </div>
            </form>
        </>
    );
}

ResourcesCreate.layout = {
    breadcrumbs: [
        { title: 'Resources', href: resourcesIndex() },
        { title: 'Create', href: resourcesIndex() },
    ],
};
