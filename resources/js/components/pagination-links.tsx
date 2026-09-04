import { Link } from '@inertiajs/react';

import { Button } from '@/components/ui/button';
import type { Paginated } from '@/types/booking';

type PaginationLinksProps<T> = {
    pagination: Paginated<T>;
    /** Noun for the summary line, e.g. "booking" → "of 7 bookings". */
    unit?: string;
};

export function PaginationLinks<T>({
    pagination,
    unit = 'result',
}: PaginationLinksProps<T>) {
    // The summary still reads usefully on a single page, so only the page
    // buttons drop out when there is nowhere to paginate to.
    const isSinglePage = pagination.last_page <= 1;

    if (isSinglePage && pagination.total === 0) {
        return null;
    }

    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground text-sm">
                Showing {pagination.from ?? 0} to {pagination.to ?? 0} of{' '}
                {pagination.total} {unit}
                {pagination.total === 1 ? '' : 's'}
            </p>
            <div className="flex flex-wrap items-center gap-1">
                {isSinglePage
                    ? null
                    : pagination.links.map((link, index) => {
                          if (!link.url) {
                              return (
                                  <Button
                                      key={`${link.label}-${index}`}
                                      variant={link.active ? 'default' : 'outline'}
                                      size="sm"
                                      disabled
                                      className="min-w-9"
                                      dangerouslySetInnerHTML={{
                                          __html: link.label,
                                      }}
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
                                      dangerouslySetInnerHTML={{
                                          __html: link.label,
                                      }}
                                  />
                              </Button>
                          );
                      })}
            </div>
        </div>
    );
}
