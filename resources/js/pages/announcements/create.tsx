import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent, useEffect, useRef, useState } from 'react';

import { QrCode } from '@/components/qr-code';
import InputError from '@/components/input-error';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ANNOUNCEMENT_TYPES } from '@/lib/announcement-type';
import { formatDateTime } from '@/lib/format';
import { join as openPlayJoin } from '@/routes/open-play';
import { create, index as announcementsIndex, store } from '@/routes/announcements';

type OpenPlaySessionOption = {
    id: number;
    title: string;
    starts_at: string;
};

type Props = {
    openPlaySessions: OpenPlaySessionOption[];
};

export default function AnnouncementsCreate({ openPlaySessions }: Props) {
    const { data, setData, post, processing, errors } = useForm<{
        title: string;
        content: string;
        type: string;
        open_play_session_id: number | null;
        image_mode: 'none' | 'upload' | 'auto_qr';
        image: File | null;
        show_on_dashboard: boolean;
        show_on_home: boolean;
        show_on_player_portal: boolean;
        is_published: boolean;
    }>({
        title: '',
        content: '',
        type: 'general',
        open_play_session_id: null,
        image_mode: 'none',
        image: null,
        show_on_dashboard: true,
        show_on_home: false,
        show_on_player_portal: true,
        is_published: false,
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);

    useEffect(() => {
        return () => {
            if (preview) {
                URL.revokeObjectURL(preview);
            }
        };
    }, [preview]);

    const selectedSession = openPlaySessions.find((session) => session.id === data.open_play_session_id) ?? null;
    const joinUrl =
        selectedSession && typeof window !== 'undefined'
            ? `${window.location.origin}${openPlayJoin(selectedSession).url}`
            : null;

    const submit = (event: FormEvent) => {
        event.preventDefault();
        post(store().url, { forceFormData: true });
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
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="grid gap-4 pt-6">
                            <div className="grid gap-2">
                                <Label htmlFor="type">Type</Label>
                                <Select
                                    value={data.type}
                                    onValueChange={(value) => {
                                        setData('type', value);

                                        if (value !== 'open_play') {
                                            setData('open_play_session_id', null);

                                            if (data.image_mode === 'auto_qr') {
                                                setData('image_mode', 'none');
                                            }
                                        }
                                    }}
                                >
                                    <SelectTrigger id="type" className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ANNOUNCEMENT_TYPES.map((type) => (
                                            <SelectItem key={type.value} value={type.value}>
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.type} />
                            </div>

                            {data.type === 'open_play' && (
                                <div className="grid gap-2">
                                    <Label htmlFor="open_play_session_id">Linked session</Label>
                                    <Select
                                        value={data.open_play_session_id ? String(data.open_play_session_id) : undefined}
                                        onValueChange={(value) => setData('open_play_session_id', Number(value))}
                                    >
                                        <SelectTrigger id="open_play_session_id" className="w-full">
                                            <SelectValue placeholder="Choose an Open Play session" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {openPlaySessions.map((session) => (
                                                <SelectItem key={session.id} value={String(session.id)}>
                                                    {session.title} — {formatDateTime(session.starts_at)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        The session&apos;s date, location, and join link will be included in the
                                        email automatically.
                                    </p>
                                    <InputError message={errors.open_play_session_id} />
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="grid gap-4 pt-6">
                            <div className="grid gap-2">
                                <Label>Image</Label>
                                <ToggleGroup
                                    type="single"
                                    variant="outline"
                                    value={data.image_mode}
                                    onValueChange={(value) => {
                                        if (!value) {
                                            return;
                                        }

                                        setData('image_mode', value as 'none' | 'upload' | 'auto_qr');

                                        if (value !== 'upload') {
                                            setData('image', null);

                                            if (preview) {
                                                URL.revokeObjectURL(preview);
                                                setPreview(null);
                                            }
                                        }
                                    }}
                                    className="w-fit"
                                >
                                    <ToggleGroupItem value="none">None</ToggleGroupItem>
                                    <ToggleGroupItem value="upload">Upload image</ToggleGroupItem>
                                    <ToggleGroupItem value="auto_qr" disabled={!selectedSession}>
                                        Auto-generate QR
                                    </ToggleGroupItem>
                                </ToggleGroup>
                                {!selectedSession && (
                                    <p className="text-xs text-muted-foreground">
                                        Auto-generate QR is available once you link this announcement to an Open
                                        Play session above.
                                    </p>
                                )}
                            </div>

                            {data.image_mode === 'upload' && (
                                <div className="grid gap-2">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        name="image"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0] ?? null;
                                            setData('image', file);

                                            if (preview) {
                                                URL.revokeObjectURL(preview);
                                            }

                                            setPreview(file ? URL.createObjectURL(file) : null);
                                        }}
                                    />
                                    <div className="flex items-center gap-4">
                                        {preview && (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={preview}
                                                alt=""
                                                className="size-20 rounded-lg border object-cover"
                                            />
                                        )}
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            Choose image
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">JPG or PNG, up to 4MB.</p>
                                    <InputError message={errors.image} />
                                </div>
                            )}

                            {data.image_mode === 'auto_qr' && joinUrl && (
                                <div className="flex items-center gap-4">
                                    <QrCode value={joinUrl} size={96} className="shrink-0 rounded-lg border p-2" />
                                    <p className="text-xs text-muted-foreground">
                                        Members can scan this to jump straight to the join page — it&apos;s
                                        generated fresh when the announcement is saved.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="space-y-3 pt-6">
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
                            <p className="text-xs text-muted-foreground">
                                Publishing emails every member immediately with the content and image above.
                            </p>
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
