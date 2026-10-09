import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect } from 'react';

import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { GalleryPhoto } from '@/types/booking';

/**
 * Full-screen photo viewer. Opens with the dialog's fade + zoom, steps through
 * `photos` with the arrow buttons or ←/→ keys, and wraps at either end.
 * `index` is controlled by the parent; null means closed.
 */
export function PhotoLightbox({
    photos,
    index,
    onIndexChange,
}: {
    photos: GalleryPhoto[];
    index: number | null;
    onIndexChange: (index: number | null) => void;
}) {
    const open = index !== null && photos[index] !== undefined;
    const photo = open ? photos[index] : null;
    const hasMany = photos.length > 1;

    const step = (delta: number) => {
        if (index === null) {
            return;
        }

        onIndexChange((index + delta + photos.length) % photos.length);
    };

    useEffect(() => {
        if (!open || !hasMany) {
            return;
        }

        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'ArrowRight') {
                step(1);
            } else if (event.key === 'ArrowLeft') {
                step(-1);
            }
        };

        window.addEventListener('keydown', onKey);

        return () => window.removeEventListener('keydown', onKey);
    });

    return (
        <Dialog open={open} onOpenChange={(next) => !next && onIndexChange(null)}>
            <DialogContent
                className={cn(
                    'max-w-[calc(100%-2rem)] gap-3 border-0 bg-transparent p-0 shadow-none sm:max-w-5xl',
                    // The dialog's own close button, recoloured for the dark backdrop.
                    '[&>button:last-child]:-top-10 [&>button:last-child]:right-0 [&>button:last-child]:text-white [&>button:last-child]:opacity-90',
                )}
            >
                <DialogTitle className="sr-only">{photo?.caption ?? 'Photo'}</DialogTitle>
                <DialogDescription className="sr-only">
                    {hasMany ? 'Use the arrow keys to see more photos.' : 'Photo viewer'}
                </DialogDescription>

                {photo ? (
                    <div className="relative">
                        <img
                            key={photo.id}
                            src={photo.url}
                            alt={photo.caption ?? 'Photo'}
                            className="animate-in fade-in-0 mx-auto max-h-[80vh] w-auto rounded-lg object-contain duration-300"
                        />

                        {hasMany ? (
                            <>
                                <LightboxArrow side="left" onClick={() => step(-1)} />
                                <LightboxArrow side="right" onClick={() => step(1)} />
                            </>
                        ) : null}
                    </div>
                ) : null}

                {photo ? (
                    <div className="flex items-center justify-between gap-4 text-sm text-white">
                        <span className="font-medium">{photo.caption ?? ''}</span>
                        {hasMany ? (
                            <span className="shrink-0 text-white/70 tabular-nums">
                                {(index ?? 0) + 1} / {photos.length}
                            </span>
                        ) : null}
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}

function LightboxArrow({ side, onClick }: { side: 'left' | 'right'; onClick: () => void }) {
    const Icon = side === 'left' ? ChevronLeft : ChevronRight;

    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={side === 'left' ? 'Previous photo' : 'Next photo'}
            className={cn(
                'absolute top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70',
                side === 'left' ? 'left-2' : 'right-2',
            )}
        >
            <Icon className="size-6" />
        </button>
    );
}
