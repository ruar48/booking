import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

import { ConfirmDialog } from '@/components/confirm-dialog';
import InputError from '@/components/input-error';
import { OpenPlayJoinQrCard } from '@/components/open-play-join-qr-card';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import type { ClubEvent } from '@/types/booking';

type Props = {
    session: ClubEvent;
};

function toDatetimeLocal(value?: string | null): string {
    if (!value) {
        return '';
    }

    return value.slice(0, 16);
}

export default function OpenPlayEdit({ session }: Props) {
    const [deleteOpen, setDeleteOpen] = useState(false);

    const { data, setData, put, processing, errors } = useForm({
        title: session.title,
        description: session.description ?? '',
        starts_at: toDatetimeLocal(session.starts_at),
        ends_at: toDatetimeLocal(session.ends_at),
        location: session.location ?? '',
        price_per_player: String(session.price_per_player ?? ''),
        max_players: String(session.max_players ?? ''),
        skill_level: session.skill_level ?? 'all_levels',
        team_size: session.team_size ?? 'singles',
        bracket_format: session.bracket_format ?? 'round_robin',
        bracket_generation: session.bracket_generation ?? 'automatic',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        put(update(session).url);
    };

    return (
        <>
            <Head title={`Edit ${session.title}`} />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <PageHeader
                    title="Edit open play session"
                    description={session.title}
                    actions={
                        <Button
                            variant="destructive"
                            onClick={() => setDeleteOpen(true)}
                        >
                            Delete
                        </Button>
                    }
                />
                <form onSubmit={submit} className="mx-auto w-full max-w-2xl space-y-6">
                    <Card>
                        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
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
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={3}
                                />
                                <InputError message={errors.description} />
                            </div>
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
                            <div className="grid gap-2">
                                <Label htmlFor="location">Courts</Label>
                                <Input
                                    id="location"
                                    value={data.location}
                                    onChange={(e) => setData('location', e.target.value)}
                                />
                                <InputError message={errors.location} />
                            </div>
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
                                        <SelectItem value="all_levels">All levels</SelectItem>
                                        <SelectItem value="beginner">Beginner</SelectItem>
                                        <SelectItem value="intermediate">Intermediate</SelectItem>
                                        <SelectItem value="advanced">Advanced</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.skill_level} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="price_per_player">Price per player</Label>
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
                                    onChange={(e) => setData('max_players', e.target.value)}
                                />
                                <InputError message={errors.max_players} />
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
                                        <SelectItem value="singles">1v1 (Singles)</SelectItem>
                                        <SelectItem value="doubles">2v2 (Doubles)</SelectItem>
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
                                        <SelectItem value="round_robin">Round robin</SelectItem>
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
                        </CardContent>
                    </Card>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" asChild>
                            <Link href={openPlayIndex()}>Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            Save changes
                        </Button>
                    </div>
                </form>

                <div className="mx-auto w-full max-w-2xl">
                    <OpenPlayJoinQrCard session={session} />
                </div>
            </div>

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
