import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

import { ConfirmDialog } from '@/components/confirm-dialog';
import InputError from '@/components/input-error';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { destroy, index as announcementsIndex, update } from '@/routes/announcements';
import type { Announcement } from '@/types/booking';

type Props = {
    announcement: Announcement;
};

export default function AnnouncementsEdit({ announcement }: Props) {
    const [deleteOpen, setDeleteOpen] = useState(false);

    const { data, setData, put, processing, errors } = useForm({
        club_id: announcement.club_id ?? '',
        title: announcement.title,
        content: announcement.content,
        show_on_dashboard: announcement.show_on_dashboard,
        show_on_home: announcement.show_on_home,
        show_on_player_portal: announcement.show_on_player_portal,
        is_published: announcement.is_published,
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        put(update(announcement).url);
    };

    return (
        <>
            <Head title={`Edit ${announcement.title}`} />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <PageHeader
                    title="Edit announcement"
                    description={announcement.club?.name ?? 'Global announcement'}
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
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="is_published"
                                    checked={data.is_published}
                                    onCheckedChange={(checked) =>
                                        setData('is_published', checked === true)
                                    }
                                />
                                <Label htmlFor="is_published">Published</Label>
                            </div>
                        </CardContent>
                    </Card>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" asChild>
                            <Link href={announcementsIndex()}>Cancel</Link>
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
                title="Delete announcement"
                description="This announcement will be permanently removed."
                confirmLabel="Delete"
                variant="destructive"
                onConfirm={() => router.delete(destroy(announcement).url)}
            />
        </>
    );
}

AnnouncementsEdit.layout = {
    breadcrumbs: [
        { title: 'Announcements', href: announcementsIndex() },
        { title: 'Edit', href: announcementsIndex() },
    ],
};
