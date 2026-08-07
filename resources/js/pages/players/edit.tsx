import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

import { ConfirmDialog } from '@/components/confirm-dialog';
import InputError from '@/components/input-error';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { destroy, index as playersIndex, show, update } from '@/routes/players';
import type { Player } from '@/types/booking';

type Props = {
    player: Player;
};

export default function PlayersEdit({ player }: Props) {
    const [deleteOpen, setDeleteOpen] = useState(false);

    const { data, setData, put, processing, errors } = useForm({
        user_id: player.user_id,
        skill_rating: player.skill_rating,
        experience_level: player.experience_level,
        playing_hand: player.playing_hand ?? '',
        gender: player.gender ?? '',
        birthdate: player.birthdate ?? '',
        phone: player.phone ?? '',
        address: player.address ?? '',
        emergency_contact_name: player.emergency_contact_name ?? '',
        emergency_contact_phone: player.emergency_contact_phone ?? '',
        bio: player.bio ?? '',
        is_active: player.is_active,
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        put(update(player).url);
    };

    return (
        <>
            <Head title={`Edit ${player.user?.name ?? 'Player'}`} />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <PageHeader
                    title={`Edit ${player.user?.name ?? 'Player'}`}
                    description="Update player profile information"
                    actions={
                        <div className="flex gap-2">
                            <Button variant="outline" asChild>
                                <Link href={show(player)}>View</Link>
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => setDeleteOpen(true)}
                            >
                                Delete
                            </Button>
                        </div>
                    }
                />
                <form onSubmit={submit} className="mx-auto w-full max-w-3xl space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label>Experience level</Label>
                                <Select
                                    value={data.experience_level}
                                    onValueChange={(v) => setData('experience_level', v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="beginner">Beginner</SelectItem>
                                        <SelectItem value="intermediate">Intermediate</SelectItem>
                                        <SelectItem value="advanced">Advanced</SelectItem>
                                        <SelectItem value="professional">Professional</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.experience_level} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="skill_rating">Skill rating</Label>
                                <Input
                                    id="skill_rating"
                                    type="number"
                                    value={data.skill_rating}
                                    onChange={(e) =>
                                        setData('skill_rating', Number(e.target.value))
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor="bio">Bio</Label>
                                <Textarea
                                    id="bio"
                                    value={data.bio}
                                    onChange={(e) => setData('bio', e.target.value)}
                                    rows={4}
                                />
                            </div>
                            <div className="flex items-center gap-2 sm:col-span-2">
                                <Checkbox
                                    id="is_active"
                                    checked={data.is_active}
                                    onCheckedChange={(checked) =>
                                        setData('is_active', checked === true)
                                    }
                                />
                                <Label htmlFor="is_active">Player is active</Label>
                            </div>
                        </CardContent>
                    </Card>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" asChild>
                            <Link href={playersIndex()}>Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            Save changes
                        </Button>
                    </div>
                </form>
            </div>

            <ConfirmDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                title="Delete player"
                description="This will permanently remove the player profile."
                confirmLabel="Delete"
                variant="destructive"
                onConfirm={() => router.delete(destroy(player).url)}
            />
        </>
    );
}

PlayersEdit.layout = {
    breadcrumbs: [
        { title: 'Players', href: playersIndex() },
        { title: 'Edit', href: playersIndex() },
    ],
};
