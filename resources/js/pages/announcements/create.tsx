import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

import InputError from '@/components/input-error';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { create, index as announcementsIndex, store } from '@/routes/announcements';

export default function AnnouncementsCreate() {
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        content: '',
        show_on_dashboard: true,
        show_on_home: false,
        show_on_player_portal: true,
        is_published: false,
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        post(store().url);
    };

    return (
        <>
            <Head title="Create Announcement" />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <PageHeader
                    title="Create announcement"
                    description="Share news with club members"
                />
                <form onSubmit={submit} className="mx-auto w-full max-w-2xl space-y-6">
                    <Card>
                        <CardContent className="grid gap-4 pt-6">
                            <div className="grid gap-2">
                                <Label htmlFor="title">Title</Label>
                                <Input
                                    id="title"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    required
                                />
                                <InputError message={errors.title} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="content">Content</Label>
                                <Textarea
                                    id="content"
                                    value={data.content}
                                    onChange={(e) => setData('content', e.target.value)}
                                    rows={8}
                                    required
                                />
                                <InputError message={errors.content} />
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="show_on_dashboard"
                                        checked={data.show_on_dashboard}
                                        onCheckedChange={(checked) =>
                                            setData('show_on_dashboard', checked === true)
                                        }
                                    />
                                    <Label htmlFor="show_on_dashboard">
                                        Show on dashboard
                                    </Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="show_on_home"
                                        checked={data.show_on_home}
                                        onCheckedChange={(checked) =>
                                            setData('show_on_home', checked === true)
                                        }
                                    />
                                    <Label htmlFor="show_on_home">Show on home</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="is_published"
                                        checked={data.is_published}
                                        onCheckedChange={(checked) =>
                                            setData('is_published', checked === true)
                                        }
                                    />
                                    <Label htmlFor="is_published">Publish immediately</Label>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" asChild>
                            <Link href={announcementsIndex()}>Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            Create announcement
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

AnnouncementsCreate.layout = {
    breadcrumbs: [
        { title: 'Announcements', href: announcementsIndex() },
        { title: 'Create', href: create() },
    ],
};
