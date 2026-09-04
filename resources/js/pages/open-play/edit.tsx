import { Head, Link, router, useForm } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import { FormEvent, useState } from 'react';

import { ConfirmDialog } from '@/components/confirm-dialog';
import { FormSection } from '@/components/form-section';
import InputError from '@/components/input-error';
import { OpenPlayJoinQrCard } from '@/components/open-play-join-qr-card';
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
import { destroy, index as openPlayIndex, update } from '@/routes/open-play';
import type { OpenPlaySession, Resource } from '@/types/booking';

type Props = {
    session: OpenPlaySession;
    resources: Resource[];
};

function toDatetimeLocal(value?: string | null): string {
    if (!value) {
        return '';
    }

    return value.slice(0, 16);
}

export default function OpenPlayEdit({ session, resources }: Props) {
    const [deleteOpen, setDeleteOpen] = useState(false);

    const { data, setData, put, processing, errors, isDirty } = useForm({
        title: session.title,
        description: session.description ?? '',
        starts_at: toDatetimeLocal(session.starts_at),
        ends_at: toDatetimeLocal(session.ends_at),
        registration_closes_at: toDatetimeLocal(session.registration_closes_at),
        location: session.location ?? '',
        price_per_player: String(session.price_per_player ?? ''),
        max_players: String(session.max_players ?? ''),
        skill_level: session.skill_level ?? 'all_levels',
        team_size: session.team_size ?? 'singles',
        bracket_format: session.bracket_format ?? 'round_robin',
        bracket_generation: session.bracket_generation ?? 'automatic',
        resource_ids: (session.resources ?? []).map((resource) => resource.id),
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        put(update(session).url);
    };

    const toggleResource = (resourceId: number, checked: boolean) => {
        setData(
            'resource_ids',
            checked
                ? [...data.resource_ids, resourceId]
                : data.resource_ids.filter((id) => id !== resourceId),
        );
    };

    return (
        <>
            <Head title={`Edit ${session.title}`} />
            <form onSubmit={submit} className="flex flex-1 flex-col gap-6 p-4">
                <PageHeader
                    title="Edit open play session"
                    description={session.title}
                    actions={
                        <Button
                            type="button"
                            variant="outline"
                            className="text-destructive hover:text-destructive border-red-200 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/30"
                            onClick={() => setDeleteOpen(true)}
                        >
                            <Trash2 className="size-4" />
                            Delete
                        </Button>
                    }
                />

                <div className="grid gap-6 xl:grid-cols-3">
                    {/* Main column — what the session is and how it runs. */}
                    <div className="space-y-6 xl:col-span-2">
                        <FormSection
                            title="Session details"
                            description="How this session appears to members."
                        >
                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor="title">Title</Label>
                                <Input
                                    id="title"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    required
                                />
                                <InputError message={errors.title} />
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

                        <FormSection
                            title="Schedule"
                            description="When the session runs, and the cutoff for joining."
                        >
                            <div className="grid gap-2">
                                <Label htmlFor="starts_at">Starts at</Label>
                                <Input
                                    id="starts_at"
                                    type="datetime-local"
                                    value={data.starts_at}
                                    onChange={(e) => setData('starts_at', e.target.value)}
                                    required
                                />
                                <InputError message={errors.starts_at} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="ends_at">Ends at</Label>
                                <Input
                                    id="ends_at"
                                    type="datetime-local"
                                    value={data.ends_at}
                                    onChange={(e) => setData('ends_at', e.target.value)}
                                    required
                                />
                                <InputError message={errors.ends_at} />
                            </div>
                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor="registration_closes_at">
                                    Registration closes at
                                </Label>
                                <Input
                                    id="registration_closes_at"
                                    type="datetime-local"
                                    value={data.registration_closes_at}
                                    onChange={(e) =>
                                        setData(
                                            'registration_closes_at',
                                            e.target.value,
                                        )
                                    }
                                />
                                <p className="text-muted-foreground text-xs">
                                    Optional. After this time members can no longer
                                    join — leave blank to allow registration until the
                                    session starts.
                                </p>
                                <InputError
                                    message={errors.registration_closes_at}
                                />
                            </div>
                        </FormSection>

                        <FormSection
                            title="Format"
                            description="How matches are organised once the session starts."
                        >
                            <div className="grid gap-2">
                                <Label>Skill level</Label>
                                <Select
                                    value={data.skill_level}
                                    onValueChange={(v) => setData('skill_level', v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all_levels">
                                            All levels
                                        </SelectItem>
                                        <SelectItem value="beginner">Beginner</SelectItem>
                                        <SelectItem value="intermediate">
                                            Intermediate
                                        </SelectItem>
                                        <SelectItem value="advanced">Advanced</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.skill_level} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Match type</Label>
                                <Select
                                    value={data.team_size}
                                    onValueChange={(v) =>
                                        setData('team_size', v as 'singles' | 'doubles')
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="singles">
                                            1v1 (Singles)
                                        </SelectItem>
                                        <SelectItem value="doubles">
                                            2v2 (Doubles)
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.team_size} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Bracket format</Label>
                                <Select
                                    value={data.bracket_format}
                                    onValueChange={(v) =>
                                        setData(
                                            'bracket_format',
                                            v as
                                                | 'round_robin'
                                                | 'single_elimination'
                                                | 'double_elimination',
                                        )
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="round_robin">
                                            Round robin
                                        </SelectItem>
                                        <SelectItem value="single_elimination">
                                            Single elimination
                                        </SelectItem>
                                        <SelectItem value="double_elimination">
                                            Double elimination
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.bracket_format} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Matchup generation</Label>
                                <Select
                                    value={data.bracket_generation}
                                    onValueChange={(v) =>
                                        setData(
                                            'bracket_generation',
                                            v as 'automatic' | 'random' | 'manual',
                                        )
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="automatic">
                                            Automatic (seeded by registration order)
                                        </SelectItem>
                                        <SelectItem value="random">Random draw</SelectItem>
                                        <SelectItem value="manual">
                                            Manual (I&apos;ll set up matchups myself)
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.bracket_generation} />
                            </div>
                        </FormSection>
                    </div>

                    {/* Side column — capacity, courts, and the share QR. */}
                    <div className="space-y-6">
                        <FormSection
                            title="Capacity & pricing"
                            contentClassName="grid gap-4 p-5 sm:grid-cols-1"
                        >
                            <div className="grid gap-2">
                                <Label htmlFor="price_per_player">
                                    Price per player
                                </Label>
                                <Input
                                    id="price_per_player"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.price_per_player}
                                    onChange={(e) =>
                                        setData('price_per_player', e.target.value)
                                    }
                                />
                                <InputError message={errors.price_per_player} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="max_players">Max players</Label>
                                <Input
                                    id="max_players"
                                    type="number"
                                    min="1"
                                    value={data.max_players}
                                    onChange={(e) =>
                                        setData('max_players', e.target.value)
                                    }
                                />
                                <InputError message={errors.max_players} />
                            </div>
                        </FormSection>

                        <FormSection
                            title="Courts"
                            description="Reserved courts are closed to regular bookings for the session's duration."
                            contentClassName="grid gap-4 p-5 sm:grid-cols-1"
                        >
                            <div className="grid gap-2">
                                <Label htmlFor="location">Display label</Label>
                                <Input
                                    id="location"
                                    value={data.location}
                                    onChange={(e) =>
                                        setData('location', e.target.value)
                                    }
                                    placeholder="Courts 1, 2"
                                />
                                <InputError message={errors.location} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Reserve courts</Label>
                                <div className="grid gap-1">
                                    {resources.map((resource) => (
                                        <label
                                            key={resource.id}
                                            className="hover:bg-muted flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors"
                                        >
                                            <Checkbox
                                                checked={data.resource_ids.includes(
                                                    resource.id,
                                                )}
                                                onCheckedChange={(checked) =>
                                                    toggleResource(
                                                        resource.id,
                                                        checked === true,
                                                    )
                                                }
                                            />
                                            {resource.name}
                                        </label>
                                    ))}
                                </div>
                                <InputError message={errors.resource_ids} />
                            </div>
                        </FormSection>

                        <OpenPlayJoinQrCard session={session} />
                    </div>
                </div>

                {/* Sticky so Save stays reachable on a form this tall. */}
                <div className="bg-background/95 sticky bottom-0 -mx-4 mt-auto flex items-center justify-end gap-2 border-t px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/75">
                    {isDirty ? (
                        <p className="text-muted-foreground mr-auto text-xs">
                            You have unsaved changes.
                        </p>
                    ) : null}
                    <Button variant="outline" asChild>
                        <Link href={openPlayIndex()}>Cancel</Link>
                    </Button>
                    <Button type="submit" disabled={processing}>
                        {processing ? 'Saving…' : 'Save changes'}
                    </Button>
                </div>
            </form>

            <ConfirmDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                title="Delete session"
                description="This open play session will be removed from your public page."
                confirmLabel="Delete"
                variant="destructive"
                onConfirm={() => router.delete(destroy(session).url)}
            />
        </>
    );
}

OpenPlayEdit.layout = {
    breadcrumbs: [
        { title: 'Open play', href: openPlayIndex() },
        { title: 'Edit', href: openPlayIndex() },
    ],
};
