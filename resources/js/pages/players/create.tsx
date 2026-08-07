import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

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
import { create, index as playersIndex, store } from '@/routes/players';

export default function PlayersCreate() {
    const { data, setData, post, processing, errors } = useForm({
        user_id: '',
        skill_rating: 1000,
        experience_level: 'beginner',
        playing_hand: '',
        gender: '',
        birthdate: '',
        phone: '',
        address: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        bio: '',
        is_active: true,
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        post(store().url);
    };

    return (
        <>
            <Head title="Create Player" />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <PageHeader
                    title="Create player"
                    description="Register a new player profile"
                />
                <form onSubmit={submit} className="mx-auto w-full max-w-3xl space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Account</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="user_id">User ID</Label>
                                <Input
                                    id="user_id"
                                    type="number"
                                    value={data.user_id}
                                    onChange={(e) => setData('user_id', e.target.value)}
                                    required
                                />
                                <InputError message={errors.user_id} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="experience_level">Experience level</Label>
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
                                <InputError message={errors.skill_rating} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Profile details</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="playing_hand">Playing hand</Label>
                                <Select
                                    value={data.playing_hand || 'none'}
                                    onValueChange={(v) =>
                                        setData('playing_hand', v === 'none' ? '' : v)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Not specified</SelectItem>
                                        <SelectItem value="left">Left</SelectItem>
                                        <SelectItem value="right">Right</SelectItem>
                                        <SelectItem value="ambidextrous">Ambidextrous</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="birthdate">Birthdate</Label>
                                <Input
                                    id="birthdate"
                                    type="date"
                                    value={data.birthdate}
                                    onChange={(e) => setData('birthdate', e.target.value)}
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
                                    rows={3}
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
                            Create player
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

PlayersCreate.layout = {
    breadcrumbs: [
        { title: 'Players', href: playersIndex() },
        { title: 'Create', href: create() },
    ],
};
