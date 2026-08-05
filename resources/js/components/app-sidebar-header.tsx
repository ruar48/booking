import { usePage } from '@inertiajs/react';
import { Bell } from 'lucide-react';

import { Breadcrumbs } from '@/components/breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const { notificationsCount } = usePage().props;

    return (
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex min-w-0 flex-1 items-center gap-2">
                <SidebarTrigger className="-ml-1 hidden md:inline-flex" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>

            <Button variant="ghost" size="icon" className="relative shrink-0" aria-label="Notifications">
                <Bell className="size-4" />
                {notificationsCount > 0 ? (
                    <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full p-0 text-[10px]"
                    >
                        {notificationsCount > 99 ? '99+' : notificationsCount}
                    </Badge>
                ) : null}
            </Button>
        </header>
    );
}
