import { Head, router, useForm } from '@inertiajs/react';
import { CalendarClock, Pencil, Phone, Plus, Trash2, UserRound, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';

import { ConfirmDialog } from '@/components/confirm-dialog';
import InputError from '@/components/input-error';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { formatClock, formatCurrency } from '@/lib/format';
import { destroy, index as coachesIndex, store, update } from '@/routes/coaches';
import type { Coach, CoachSlot } from '@/types/booking';

type Props = {
    coaches: Coach[];
    maxUploadBytes: number;
};

/** Monday first, valued by day-of-week (0 = Sunday) to match the server. */
const WEEK = [
    { day: 1, short: 'Mon', long: 'Monday' },
    { day: 2, short: 'Tue', long: 'Tuesday' },
    { day: 3, short: 'Wed', long: 'Wednesday' },
    { day: 4, short: 'Thu', long: 'Thursday' },
    { day: 5, short: 'Fri', long: 'Friday' },
    { day: 6, short: 'Sat', long: 'Saturday' },
    { day: 0, short: 'Sun', long: 'Sunday' },
];

const dayLabel = (day: number) => WEEK.find((d) => d.day === day)?.short ?? '';

const splitList = (value: string) =>
    value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

export default function CoachesIndex({ coaches, maxUploadBytes }: Props) {
    // undefined = closed, null = adding a new coach.
    const [editing, setEditing] = useState<Coach | null | undefined>(undefined);
    const [coachToDelete, setCoachToDelete] = useState<Coach | null>(null);

    return (
        <>
            <Head title="Coaches" />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <PageHeader
                    title="Coaches"
                    description="Coaches offering training at your venue. Active coaches appear on your public page with their weekly availability."
                    actions={
                        <Button onClick={() => setEditing(null)}>
                            <Plus className="size-4" />
                            Add coach
                        </Button>
                    }
                />

                {coaches.length === 0 ? (
                    <Card>
                        <CardContent className="text-muted-foreground flex flex-col items-center gap-2 py-12 text-center text-sm">
                            <UserRound className="size-8" />
                            No coaches yet. Add one and they'll show on your public page.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {coaches.map((coach) => (
                            <CoachCard
                                key={coach.id}
                                coach={coach}
                                onEdit={() => setEditing(coach)}
                                onDelete={() => setCoachToDelete(coach)}
                            />
                        ))}
                    </div>
                )}
            </div>

            <Dialog open={editing !== undefined} onOpenChange={(open) => !open && setEditing(undefined)}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                    {/* Keyed so the form re-initialises for each coach opened. */}
                    {editing !== undefined ? (
                        <CoachForm
                            key={editing?.id ?? 'new'}
                            coach={editing}
                            maxUploadBytes={maxUploadBytes}
                            onClose={() => setEditing(undefined)}
                        />
                    ) : null}
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={coachToDelete !== null}
                onOpenChange={(open) => !open && setCoachToDelete(null)}
                title="Remove coach"
                description={
                    coachToDelete ? `${coachToDelete.name} will be removed from your public page.` : undefined
                }
                confirmLabel="Remove"
                variant="destructive"
                onConfirm={() => {
                    if (coachToDelete) {
                        router.delete(destroy(coachToDelete).url, {
                            preserveScroll: true,
                            onSuccess: () => setCoachToDelete(null),
                        });
                    }
                }}
            />
        </>
    );
}

function CoachAvatar({ coach, className }: { coach: Pick<Coach, 'name' | 'photo_url'>; className?: string }) {
    const initials = coach.name
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('');

    return coach.photo_url ? (
        <img src={coach.photo_url} alt={coach.name} className={`rounded-full object-cover ${className}`} />
    ) : (
        <span
            className={`bg-muted text-muted-foreground flex items-center justify-center rounded-full font-semibold ${className}`}
        >
            {initials}
        </span>
    );
}

function CoachCard({ coach, onEdit, onDelete }: { coach: Coach; onEdit: () => void; onDelete: () => void }) {
    const slots = coach.availability ?? [];

    return (
        <Card className="gap-0 py-0">
            <CardContent className="space-y-4 p-4">
                <div className="flex items-start gap-3">
                    <CoachAvatar coach={coach} className="size-14 shrink-0 text-lg" />
                    <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate font-semibold">{coach.name}</p>
                            <Badge variant={coach.is_active ? 'secondary' : 'outline'}>
                                {coach.is_active ? 'Shown' : 'Hidden'}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground text-xs">
                            {coach.years_experience > 0 ? `${coach.years_experience} yrs experience` : 'Coach'}
                            {coach.rate_per_hour != null ? ` · ${formatCurrency(coach.rate_per_hour)}/hr` : ''}
                        </p>
                        {coach.phone ? (
                            <p className="text-muted-foreground flex items-center gap-1 text-xs">
                                <Phone className="size-3" />
                                {coach.phone}
                            </p>
                        ) : null}
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                        <Button variant="outline" size="icon" className="size-8" title="Edit coach" onClick={onEdit}>
                            <Pencil className="size-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="text-destructive hover:text-destructive size-8 hover:bg-red-50 dark:hover:bg-red-950/30"
                            title="Remove coach"
                            onClick={onDelete}
                        >
                            <Trash2 className="size-4" />
                        </Button>
                    </div>
                </div>

                {coach.specialties?.length ? (
                    <div className="flex flex-wrap gap-1.5">
                        {coach.specialties.map((specialty) => (
                            <Badge key={specialty} variant="outline">
                                {specialty}
                            </Badge>
                        ))}
                    </div>
                ) : null}

                <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
                        <CalendarClock className="size-3.5" />
                        Weekly availability
                    </p>
                    {slots.length === 0 ? (
                        <p className="text-muted-foreground text-xs">No time slots set.</p>
                    ) : (
                        <ul className="space-y-0.5 text-xs">
                            {slots.map((slot, i) => (
                                <li key={i}>
                                    <span className="inline-block w-9 font-medium">{dayLabel(slot.day)}</span>
                                    {formatClock(slot.start)} – {formatClock(slot.end)}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

type CoachFormData = {
    name: string;
    phone: string;
    bio: string;
    years_experience: string;
    rate_per_hour: string;
    specialties: string;
    certifications: string;
    availability: CoachSlot[];
    is_active: boolean;
    photo: File | null;
    remove_photo: boolean;
};

function CoachForm({
    coach,
    maxUploadBytes,
    onClose,
}: {
    coach: Coach | null;
    maxUploadBytes: number;
    onClose: () => void;
}) {
    const [preview, setPreview] = useState<string | null>(null);
    const [photoError, setPhotoError] = useState<string | null>(null);
    const maxMb = Math.round((maxUploadBytes / 1024 / 1024) * 10) / 10;

    const { data, setData, post, transform, processing, errors } = useForm<CoachFormData>({
        name: coach?.name ?? '',
        phone: coach?.phone ?? '',
        bio: coach?.bio ?? '',
        years_experience: coach?.years_experience ? String(coach.years_experience) : '',
        rate_per_hour: coach?.rate_per_hour != null ? String(Number(coach.rate_per_hour)) : '',
        specialties: (coach?.specialties ?? []).join(', '),
        certifications: (coach?.certifications ?? []).join(', '),
        availability: coach?.availability ?? [],
        is_active: coach?.is_active ?? true,
        photo: null,
        remove_photo: false,
    });

    useEffect(() => {
        return () => {
            if (preview) {
                URL.revokeObjectURL(preview);
            }
        };
    }, [preview]);

    // Per-slot errors arrive keyed as availability.0.end and so on.
    const fieldErrors = errors as Record<string, string | undefined>;
    const slotError = Object.entries(fieldErrors).find(([key]) => key.startsWith('availability'))?.[1];

    const choosePhoto = (file: File | undefined) => {
        // Past the server's limit PHP drops the file before validation, which
        // only yields a vague "failed to upload" — so catch it here.
        if (file && file.size > maxUploadBytes) {
            setPhotoError(`That photo is over ${maxMb} MB. Resize or compress it and try again.`);

            return;
        }

        setPhotoError(null);
        setData((current) => ({ ...current, photo: file ?? null, remove_photo: false }));
        setPreview(file ? URL.createObjectURL(file) : null);
    };

    const setSlot = (index: number, patch: Partial<CoachSlot>) =>
        setData(
            'availability',
            data.availability.map((slot, i) => (i === index ? { ...slot, ...patch } : slot)),
        );

    const addSlot = () => {
        const last = data.availability.at(-1);

        // Start from the previous slot's hours on the next day: schedules
        // tend to repeat, so this is usually one click from right.
        setData('availability', [
            ...data.availability,
            last
                ? { day: (last.day + 1) % 7, start: last.start, end: last.end }
                : { day: 1, start: '08:00', end: '11:00' },
        ]);
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();

        transform((form) => ({
            ...form,
            specialties: splitList(form.specialties),
            certifications: splitList(form.certifications),
            // A file upload has to be multipart POST; Laravel reads the real
            // verb from _method.
            ...(coach ? { _method: 'patch' } : {}),
        }));

        post(coach ? update(coach).url : store().url, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: onClose,
        });
    };

    const currentPhoto = preview ?? (data.remove_photo ? null : (coach?.photo_url ?? null));

    return (
        <form onSubmit={submit} className="grid gap-5">
            <DialogHeader>
                <DialogTitle>{coach ? `Edit ${coach.name}` : 'Add coach'}</DialogTitle>
                <DialogDescription>
                    What visitors see on your public page. Leave out anything you don't want shown.
                </DialogDescription>
            </DialogHeader>

            <div className="flex items-center gap-4">
                <CoachAvatar
                    coach={{ name: data.name || '?', photo_url: currentPhoto }}
                    className="size-20 shrink-0 text-2xl"
                />
                <div className="grid flex-1 gap-2">
                    <Label htmlFor="coach-photo">Photo</Label>
                    <Input
                        id="coach-photo"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => choosePhoto(e.target.files?.[0])}
                    />
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-muted-foreground text-xs">JPG, PNG or WebP · up to {maxMb} MB</p>
                        {coach?.photo_url && !data.remove_photo && !preview ? (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => setData('remove_photo', true)}
                            >
                                Remove photo
                            </Button>
                        ) : null}
                    </div>
                    <InputError message={photoError ?? errors.photo} />
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                    <Label htmlFor="coach-name">Name</Label>
                    <Input
                        id="coach-name"
                        value={data.name}
                        maxLength={80}
                        required
                        onChange={(e) => setData('name', e.target.value)}
                    />
                    <InputError message={errors.name} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="coach-phone">Contact number (optional)</Label>
                    <Input
                        id="coach-phone"
                        type="tel"
                        value={data.phone}
                        maxLength={30}
                        placeholder="e.g. 0917 123 4567"
                        onChange={(e) => setData('phone', e.target.value)}
                    />
                    <InputError message={errors.phone} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="coach-years">Years of experience</Label>
                    <Input
                        id="coach-years"
                        type="number"
                        min={0}
                        max={60}
                        value={data.years_experience}
                        onChange={(e) => setData('years_experience', e.target.value)}
                    />
                    <InputError message={errors.years_experience} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="coach-rate">Rate per hour, ₱ (optional)</Label>
                    <Input
                        id="coach-rate"
                        type="number"
                        min={0}
                        step="0.01"
                        value={data.rate_per_hour}
                        onChange={(e) => setData('rate_per_hour', e.target.value)}
                    />
                    <InputError message={errors.rate_per_hour} />
                </div>
                <div className="grid gap-2 sm:col-span-2">
                    <Label htmlFor="coach-specialties">Specialties</Label>
                    <Input
                        id="coach-specialties"
                        value={data.specialties}
                        placeholder="Comma-separated, e.g. Beginners, Dinking, Doubles strategy"
                        onChange={(e) => setData('specialties', e.target.value)}
                    />
                    <InputError message={fieldErrors.specialties ?? fieldErrors['specialties.0']} />
                </div>
                <div className="grid gap-2 sm:col-span-2">
                    <Label htmlFor="coach-certifications">Certifications (optional)</Label>
                    <Input
                        id="coach-certifications"
                        value={data.certifications}
                        placeholder="Comma-separated, e.g. PPR Certified, IPTPA Level 1"
                        onChange={(e) => setData('certifications', e.target.value)}
                    />
                    <InputError message={fieldErrors.certifications ?? fieldErrors['certifications.0']} />
                </div>
                <div className="grid gap-2 sm:col-span-2">
                    <Label htmlFor="coach-bio">About (optional)</Label>
                    <Textarea
                        id="coach-bio"
                        rows={3}
                        maxLength={1000}
                        value={data.bio}
                        placeholder="Coaching style, who they train, achievements…"
                        onChange={(e) => setData('bio', e.target.value)}
                    />
                    <InputError message={errors.bio} />
                </div>
            </div>

            <div className="grid gap-3">
                <div className="flex items-center justify-between">
                    <Label>Weekly availability</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addSlot}>
                        <Plus className="size-4" />
                        Add time slot
                    </Button>
                </div>
                {data.availability.length === 0 ? (
                    <p className="text-muted-foreground rounded-md border border-dashed p-3 text-center text-xs">
                        No time slots yet. Visitors will see the coach without set hours.
                    </p>
                ) : (
                    <ul className="space-y-2">
                        {data.availability.map((slot, index) => (
                            <li key={index} className="flex items-center gap-2">
                                <Select
                                    value={String(slot.day)}
                                    onValueChange={(value) => setSlot(index, { day: Number(value) })}
                                >
                                    <SelectTrigger className="w-32 shrink-0" aria-label="Day">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {WEEK.map((d) => (
                                            <SelectItem key={d.day} value={String(d.day)}>
                                                {d.long}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Input
                                    type="time"
                                    aria-label="Start time"
                                    value={slot.start}
                                    onChange={(e) => setSlot(index, { start: e.target.value })}
                                />
                                <span className="text-muted-foreground text-sm">to</span>
                                <Input
                                    type="time"
                                    aria-label="End time"
                                    value={slot.end}
                                    onChange={(e) => setSlot(index, { end: e.target.value })}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 shrink-0"
                                    title="Remove time slot"
                                    onClick={() =>
                                        setData(
                                            'availability',
                                            data.availability.filter((_, i) => i !== index),
                                        )
                                    }
                                >
                                    <X className="size-4" />
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
                <InputError message={slotError} />
            </div>

            <div className="flex items-center justify-between gap-4 rounded-md border p-3">
                <div>
                    <Label htmlFor="coach-active">Show on public page</Label>
                    <p className="text-muted-foreground text-xs">Turn off to hide the coach without deleting them.</p>
                </div>
                <Switch
                    id="coach-active"
                    checked={data.is_active}
                    onCheckedChange={(checked) => setData('is_active', checked)}
                />
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                </Button>
                <Button type="submit" disabled={processing}>
                    {coach ? 'Save changes' : 'Add coach'}
                </Button>
            </DialogFooter>
        </form>
    );
}

CoachesIndex.layout = {
    breadcrumbs: [{ title: 'Coaches', href: coachesIndex() }],
};
