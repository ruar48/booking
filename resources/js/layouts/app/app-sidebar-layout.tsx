import { Head } from '@inertiajs/react';

import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { BottomNav } from '@/components/bottom-nav';
import { InertiaEffects } from '@/components/inertia-effects';
import { SupportWidget } from '@/components/support-widget';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    return (
        <AppShell variant="sidebar">
            <Head>
                <meta name="robots" content="noindex, nofollow" />
            </Head>
            <AppSidebar />
            <AppContent
                variant="sidebar"
                className="overflow-x-hidden pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0"
            >
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                {children}
            </AppContent>
            <BottomNav />
            <SupportWidget />
            <InertiaEffects />
        </AppShell>
    );
}
