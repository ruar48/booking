import { Link } from '@inertiajs/react';

import { Button } from '@/components/ui/button';
import type { Paginated } from '@/types/booking';

type PaginationLinksProps<T> = {
    pagination: Paginated<T>;
};

export function PaginationLinks<T>({ pagination }: PaginationLinksProps<T>) {
    if (pagination.last_page <= 1) {
        return null;
    }

    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground text-sm">
                Showing {pagination.from ?? 0} to {pagination.to ?? 0} of{' '}
                {pagination.total} results
            </p>
            <div className="flex flex-wrap items-center gap-1">
                {pagination.links.map((link, index) => {
                    if (!link.url) {
                        return (
                            <Button
                                key={`${link.label}-${index}`}
                                variant={link.active ? 'default' : 'outline'}
                                size="sm"
                                disabled
                                className="min-w-9"
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        );
                    }

                    return (
                        <Button
                            key={`${link.label}-${index}`}
                            variant={link.active ? 'default' : 'outline'}
                            size="sm"
                            className="min-w-9"
                            asChild
                        >
                            <Link
                                href={link.url}
                                preserveScroll
                                preserveState
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        </Button>
                    );
                })}
            </div>
        </div>
    );
}
