import { Head, router, useForm } from '@inertiajs/react';
import { Check, FolderPlus, ImageIcon, ImagePlus, Pencil, Tags, Trash2, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
import type { FormEvent } from 'react';

import { ConfirmDialog } from '@/components/confirm-dialog';
import InputError from '@/components/input-error';
import { PageHeader } from '@/components/page-header';
import { PhotoLightbox } from '@/components/photo-lightbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { formatDate } from '@/lib/format';
import { destroy, index as galleryIndex, store, update } from '@/routes/admin/gallery';
import {
    destroy as destroyCategory,
    store as storeCategory,
    update as updateCategory,
} from '@/routes/admin/gallery-categories';
import type { GalleryCategory, GalleryPhoto } from '@/types/booking';

type Props = {
    photos: GalleryPhoto[];
    categories: GalleryCategory[];
    maxUploadBytes: number;
};

// Radix Select can't hold an empty value, so "no category" gets a sentinel.
const NONE = 'none';

const toCategoryId = (value: string): number | null => (value === NONE ? null : Number(value));

const toSelectValue = (id: number | null | undefined): string => (id == null ? NONE : String(id));

export default function AdminGalleryIndex({ photos, categories, maxUploadBytes }: Props) {
    const [viewing, setViewing] = useState<number | null>(null);
    const [photoToEdit, setPhotoToEdit] = useState<GalleryPhoto | null>(null);
    const [photoToDelete, setPhotoToDelete] = useState<GalleryPhoto | null>(null);

    const categoryName = (id: number | null) =>
        categories.find((category) => category.id === id)?.name ?? null;

    return (
        <>
            <Head title="Gallery" />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <PageHeader
                    title="Gallery"
                    description="Photos shown on the Photos tab of your public page, grouped by category"
                />

                <div className="grid gap-6 lg:grid-cols-3">
                    <UploadCard categories={categories} maxUploadBytes={maxUploadBytes} />
                    <CategoriesCard categories={categories} />
                </div>

                {photos.length === 0 ? (
                    <Card>
                        <CardContent className="text-muted-foreground flex flex-col items-center gap-2 py-12 text-center text-sm">
                            <ImageIcon className="size-8" />
                            No photos yet. Until you add some, the public page shows
                            placeholders for your courts.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {photos.map((photo, index) => {
                            const category = categoryName(photo.gallery_category_id);

                            return (
                                <Card key={photo.id} className="gap-0 overflow-hidden py-0">
                                    <button
                                        type="button"
                                        onClick={() => setViewing(index)}
                                        className="bg-muted block overflow-hidden"
                                        title="View photo"
                                    >
                                        <img
                                            src={photo.url}
                                            alt={photo.caption ?? 'Gallery photo'}
                                            className="aspect-video w-full object-contain transition-transform duration-300 hover:scale-[1.03]"
                                            loading="lazy"
                                        />
                                    </button>
                                    <CardContent className="flex items-center justify-between gap-2 p-3">
                                        <div className="min-w-0 space-y-1">
                                            <p className="truncate text-sm font-medium">
                                                {photo.caption ?? 'No caption'}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Badge variant={category ? 'secondary' : 'outline'}>
                                                    {category ?? 'Uncategorized'}
                                                </Badge>
                                                <span className="text-muted-foreground text-xs">
                                                    Added {formatDate(photo.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex shrink-0 gap-1.5">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="size-8"
                                                title="Edit caption and category"
                                                onClick={() => setPhotoToEdit(photo)}
                                            >
                                                <Pencil className="size-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="text-destructive hover:text-destructive size-8 hover:bg-red-50 dark:hover:bg-red-950/30"
                                                title="Delete photo"
                                                onClick={() => setPhotoToDelete(photo)}
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            <PhotoLightbox photos={photos} index={viewing} onIndexChange={setViewing} />

            <EditPhotoDialog
                photo={photoToEdit}
                categories={categories}
                onClose={() => setPhotoToEdit(null)}
            />

            <ConfirmDialog
                open={photoToDelete !== null}
                onOpenChange={(open) => !open && setPhotoToDelete(null)}
                title="Delete photo"
                description="It will be removed from your public page."
                confirmLabel="Delete"
                variant="destructive"
                onConfirm={() => {
                    if (photoToDelete) {
                        router.delete(destroy(photoToDelete).url, {
                            preserveScroll: true,
                            onSuccess: () => setPhotoToDelete(null),
                        });
                    }
                }}
            />
        </>
    );
}

function CategorySelect({
    id,
    value,
    categories,
    onChange,
}: {
    id: string;
    value: number | null;
    categories: GalleryCategory[];
    onChange: (value: number | null) => void;
}) {
    return (
        <Select value={toSelectValue(value)} onValueChange={(v) => onChange(toCategoryId(v))}>
            <SelectTrigger id={id} className="w-full">
                <SelectValue placeholder="Choose a category" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value={NONE}>Uncategorized</SelectItem>
                {categories.map((category) => (
                    <SelectItem key={category.id} value={String(category.id)}>
                        {category.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

function UploadCard({
    categories,
    maxUploadBytes,
}: {
    categories: GalleryCategory[];
    maxUploadBytes: number;
}) {
    const fileInput = useRef<HTMLInputElement>(null);
    const [tooLarge, setTooLarge] = useState<string[]>([]);
    const maxMb = Math.round((maxUploadBytes / 1024 / 1024) * 10) / 10;

    // Catch oversized files here: past the server's limit PHP drops them
    // before validation, which only yields a vague "failed to upload".
    const chooseFiles = (files: File[]) => {
        const oversized = files.filter((file) => file.size > maxUploadBytes);

        setTooLarge(oversized.map((file) => file.name));
        setData(
            'photos',
            files.filter((file) => file.size <= maxUploadBytes),
        );
    };

    const { data, setData, post, processing, errors, reset, progress } = useForm<{
        photos: File[];
        caption: string;
        gallery_category_id: number | null;
    }>({
        photos: [],
        caption: '',
        gallery_category_id: categories[0]?.id ?? null,
    });

    // Laravel keys per-file errors as photos.0, photos.1, … — show the first.
    const fileError =
        errors.photos ??
        Object.entries(errors).find(([key]) => key.startsWith('photos.'))?.[1];

    const submit = (event: FormEvent) => {
        event.preventDefault();
        post(store().url, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                // Keep the chosen category: uploads usually come in batches.
                reset('photos', 'caption');
                setTooLarge([]);

                if (fileInput.current) {
                    fileInput.current.value = '';
                }
            },
        });
    };

    return (
        <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center gap-2">
                <ImagePlus className="text-muted-foreground size-5" />
                <CardTitle className="text-base">Upload photos</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2 sm:col-span-2">
                        <Label htmlFor="photos">Photos</Label>
                        <Input
                            ref={fileInput}
                            id="photos"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            onChange={(e) => chooseFiles(Array.from(e.target.files ?? []))}
                        />
                        <p className="text-muted-foreground text-xs">
                            JPG, PNG or WebP · up to {maxMb} MB each · up to 10 at a time
                        </p>
                        {tooLarge.length > 0 ? (
                            <InputError
                                message={`Too large (over ${maxMb} MB), skipped: ${tooLarge.join(', ')}. Resize or compress ${tooLarge.length > 1 ? 'them' : 'it'} and try again.`}
                            />
                        ) : null}
                        <InputError message={fileError} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="upload-category">Category</Label>
                        <CategorySelect
                            id="upload-category"
                            value={data.gallery_category_id}
                            categories={categories}
                            onChange={(value) => setData('gallery_category_id', value)}
                        />
                        <InputError message={errors.gallery_category_id} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="caption">Caption (optional)</Label>
                        <Input
                            id="caption"
                            value={data.caption}
                            maxLength={120}
                            placeholder="e.g. Male Court at night"
                            onChange={(e) => setData('caption', e.target.value)}
                        />
                        <InputError message={errors.caption} />
                    </div>
                    <div className="flex items-center justify-end gap-3 sm:col-span-2">
                        {progress ? (
                            <span className="text-muted-foreground text-xs">
                                Uploading… {progress.percentage}%
                            </span>
                        ) : null}
                        <Button type="submit" disabled={processing || data.photos.length === 0}>
                            <Upload className="size-4" />
                            {data.photos.length > 1 ? `Upload ${data.photos.length} photos` : 'Upload photo'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

function CategoriesCard({ categories }: { categories: GalleryCategory[] }) {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [categoryToDelete, setCategoryToDelete] = useState<GalleryCategory | null>(null);

    const addForm = useForm({ name: '' });
    const renameForm = useForm({ name: '' });

    const add = (event: FormEvent) => {
        event.preventDefault();
        addForm.post(storeCategory().url, {
            preserveScroll: true,
            onSuccess: () => addForm.reset(),
        });
    };

    const startRename = (category: GalleryCategory) => {
        renameForm.clearErrors();
        renameForm.setData('name', category.name);
        setEditingId(category.id);
    };

    const saveRename = (event: FormEvent, category: GalleryCategory) => {
        event.preventDefault();
        renameForm.patch(updateCategory(category).url, {
            preserveScroll: true,
            onSuccess: () => setEditingId(null),
        });
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center gap-2">
                <Tags className="text-muted-foreground size-5" />
                <CardTitle className="text-base">Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <form onSubmit={add} className="space-y-2">
                    <div className="flex gap-2">
                        <Input
                            value={addForm.data.name}
                            maxLength={60}
                            placeholder="New category, e.g. Events"
                            aria-label="New category name"
                            onChange={(e) => addForm.setData('name', e.target.value)}
                        />
                        <Button
                            type="submit"
                            variant="outline"
                            disabled={addForm.processing || addForm.data.name.trim() === ''}
                        >
                            <FolderPlus className="size-4" />
                            Add
                        </Button>
                    </div>
                    <InputError message={addForm.errors.name} />
                </form>

                {categories.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No categories yet.</p>
                ) : (
                    <ul className="divide-y rounded-md border">
                        {categories.map((category) =>
                            editingId === category.id ? (
                                <li key={category.id} className="p-2">
                                    <form
                                        onSubmit={(event) => saveRename(event, category)}
                                        className="flex items-center gap-1.5"
                                    >
                                        <Input
                                            autoFocus
                                            value={renameForm.data.name}
                                            maxLength={60}
                                            aria-label="Category name"
                                            className="h-8"
                                            onChange={(e) => renameForm.setData('name', e.target.value)}
                                            onKeyDown={(e) => e.key === 'Escape' && setEditingId(null)}
                                        />
                                        <Button
                                            type="submit"
                                            size="icon"
                                            className="size-8 shrink-0"
                                            title="Save"
                                            disabled={renameForm.processing}
                                        >
                                            <Check className="size-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            className="size-8 shrink-0"
                                            title="Cancel"
                                            onClick={() => setEditingId(null)}
                                        >
                                            <X className="size-4" />
                                        </Button>
                                    </form>
                                    <InputError message={renameForm.errors.name} className="mt-1" />
                                </li>
                            ) : (
                                <li key={category.id} className="flex items-center justify-between gap-2 p-2 pl-3">
                                    <span className="min-w-0 truncate text-sm">
                                        {category.name}
                                        <span className="text-muted-foreground ml-1.5 text-xs">
                                            {category.photos_count ?? 0}
                                        </span>
                                    </span>
                                    <div className="flex shrink-0 gap-1">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="size-8"
                                            title="Rename category"
                                            onClick={() => startRename(category)}
                                        >
                                            <Pencil className="size-4" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="text-destructive hover:text-destructive size-8"
                                            title="Delete category"
                                            onClick={() => setCategoryToDelete(category)}
                                        >
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </div>
                                </li>
                            ),
                        )}
                    </ul>
                )}
            </CardContent>

            <ConfirmDialog
                open={categoryToDelete !== null}
                onOpenChange={(open) => !open && setCategoryToDelete(null)}
                title="Delete category"
                description={
                    categoryToDelete
                        ? `"${categoryToDelete.name}" will be removed. Its photos are kept and become uncategorized.`
                        : undefined
                }
                confirmLabel="Delete"
                variant="destructive"
                onConfirm={() => {
                    if (categoryToDelete) {
                        router.delete(destroyCategory(categoryToDelete).url, {
                            preserveScroll: true,
                            onSuccess: () => setCategoryToDelete(null),
                        });
                    }
                }}
            />
        </Card>
    );
}

function EditPhotoDialog({
    photo,
    categories,
    onClose,
}: {
    photo: GalleryPhoto | null;
    categories: GalleryCategory[];
    onClose: () => void;
}) {
    return (
        <Dialog open={photo !== null} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                {/* Keyed so the form re-initialises for each photo opened. */}
                {photo ? <EditPhotoForm key={photo.id} photo={photo} categories={categories} onClose={onClose} /> : null}
            </DialogContent>
        </Dialog>
    );
}

function EditPhotoForm({
    photo,
    categories,
    onClose,
}: {
    photo: GalleryPhoto;
    categories: GalleryCategory[];
    onClose: () => void;
}) {
    const { data, setData, patch, processing, errors } = useForm({
        caption: photo.caption ?? '',
        gallery_category_id: photo.gallery_category_id,
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        patch(update(photo).url, { preserveScroll: true, onSuccess: onClose });
    };

    return (
        <form onSubmit={submit} className="grid gap-4">
            <DialogHeader>
                <DialogTitle>Edit photo</DialogTitle>
                <DialogDescription>Change its caption or move it to another category.</DialogDescription>
            </DialogHeader>
            <img
                src={photo.url}
                alt={photo.caption ?? 'Gallery photo'}
                className="bg-muted aspect-video w-full rounded-md object-contain"
            />
            <div className="grid gap-2">
                <Label htmlFor="edit-category">Category</Label>
                <CategorySelect
                    id="edit-category"
                    value={data.gallery_category_id}
                    categories={categories}
                    onChange={(value) => setData('gallery_category_id', value)}
                />
                <InputError message={errors.gallery_category_id} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="edit-caption">Caption</Label>
                <Input
                    id="edit-caption"
                    value={data.caption}
                    maxLength={120}
                    onChange={(e) => setData('caption', e.target.value)}
                />
                <InputError message={errors.caption} />
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                </Button>
                <Button type="submit" disabled={processing}>
                    Save
                </Button>
            </DialogFooter>
        </form>
    );
}

AdminGalleryIndex.layout = {
    breadcrumbs: [{ title: 'Gallery', href: galleryIndex() }],
};
