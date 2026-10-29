import { usePage } from '@inertiajs/react';

import { cn } from '@/lib/utils';

/**
 * Fades the page in each time the visitor lands on a different page. Layouts
 * stay mounted between visits, so the key on the Inertia component name is
 * what replays the animation. It is keyed on the component, not the URL:
 * filters and search change the URL, and remounting then would drop focus
 * from the search box mid-typing.
 */
export function PageTransition({ children, className }: { children: React.ReactNode; className?: string }) {
    const { component } = usePage();

    return (
        <div key={component} className={cn('animate-page-enter', className)}>
            {children}
        </div>
    );
}
