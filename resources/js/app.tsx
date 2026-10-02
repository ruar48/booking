import { createInertiaApp, router } from '@inertiajs/react';
import { PwaInstallPrompt } from '@/components/pwa-install-prompt';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { registerSW } from 'virtual:pwa-register';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    layout: (name) => {
        switch (true) {
            case name === 'welcome':
                return null;
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('settings/'):
                return [AppLayout, SettingsLayout];
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                {app}
                <Toaster />
                <PwaInstallPrompt />
            </TooltipProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// Sidebar and header links prefetch on hover, and Inertia then serves that
// response for 30 seconds without asking the server again. After a write it
// only flushes the page the write redirected to, so renting out, returning or
// editing an item and then clicking a nav link could still render the list
// from before the write (stale availability, revenue, names). Any completed
// write invalidates every prefetched page so the next navigation reflects it.
router.on('finish', (event) => {
    const { visit } = event.detail;

    if (visit.method !== 'get' && visit.completed) {
        router.flushAll();
    }
});

// This will set light / dark mode on load...
initializeTheme();

// Register the service worker so the app is installable and works offline.
//
// Production only. In dev the page is served by Laravel (:8000) while the dev
// service worker is served by Vite (:5173), and a service worker must be
// same-origin — so registering it there only ever 404s. A stale worker left
// registered from an earlier build can also serve cached HTML, which makes
// Inertia hydrate pre-rendered markup instead of mounting fresh and produces
// hydration mismatches.
if (import.meta.env.PROD) {
    registerSW({ immediate: true });
}
