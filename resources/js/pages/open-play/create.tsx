import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

import InputError from '@/components/input-error';
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
import { create, index as openPlayIndex, store } from '@/routes/open-play';

function defaultStartsAt(): string {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    date.setHours(18, 0, 0, 0);
    return date.toISOString().slice(0, 16);
}

function defaultEndsAt(): string {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    date.setHours(23, 0, 0, 0);
    return date.toISOString().slice(0, 16);
}

export default function OpenPlayCreate() {
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        description: '',
        starts_at: defaultStartsAt(),
        ends_at: defaultEndsAt(),
        location: 'Courts 1, 2',
        price_per_player: '10',
        max_players: '16',
        skill_level: 'all_levels',
        team_size: 'singles',
        bracket_format: 'round_robin',
        bracket_generation: 'automatic',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        post(store().url);
    };

    return (
        <>
            <Head title="New Open Play Session" />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <PageHeader
                    title="New open play session"
                    description="This will appear on your public Open play tab"
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
                                    placeholder="Friday Open Play"
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
                                    onValueChange={(v) => setData('team_size', v)}
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
                                    onValueChange={(v) => setData('bracket_format', v)}
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
                                    onValueChange={(v) => setData('bracket_generation', v)}
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
                            Create session
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

OpenPlayCreate.layout = {
    breadcrumbs: [
        { title: 'Open play', href: openPlayIndex() },
        { title: 'Create', href: create() },
    ],
};
