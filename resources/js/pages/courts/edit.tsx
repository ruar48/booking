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
import { index as courtsIndex, update } from '@/routes/courts';
import type { Court } from '@/types/booking';

type Props = {
    court: Court;
};

export default function CourtsEdit({ court }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        club_id: court.club_id,
        name: court.name,
        court_number: court.court_number,
        surface_type: court.surface_type,
        location_type: court.location_type,
        has_lighting: court.has_lighting,
        hourly_rate: court.hourly_rate,
        status: court.status,
        description: court.description ?? '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        put(update(court).url);
    };

    return (
        <>
            <Head title={`Edit ${court.name}`} />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <PageHeader
                    title={`Edit ${court.name}`}
                    description="Update rates, surface, and availability"
                />
                <form onSubmit={submit} className="mx-auto w-full max-w-2xl space-y-6">
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
                                <Label htmlFor="court_number">Court number</Label>
                                <Input
                                    id="court_number"
                                    value={data.court_number}
                                    onChange={(e) => setData('court_number', e.target.value)}
                                    required
                                />
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
                            <Link href={courtsIndex()}>Back</Link>
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

CourtsEdit.layout = {
    breadcrumbs: [
        { title: 'Courts', href: courtsIndex() },
        { title: 'Edit', href: courtsIndex() },
    ],
};
