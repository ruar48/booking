import { createInertiaApp, router } from '@inertiajs/react';
import { lazy, Suspense } from 'react';
import { registerSW } from 'virtual:pwa-register';
import { NavigationLoader } from '@/components/navigation-loader';
import { PwaInstallPrompt } from '@/components/pwa-install-prompt';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import { brand } from '@/lib/brand';

// From the brand, not VITE_APP_NAME: the env default is "Laravel", and a stale
// build-time value would put that in every browser tab.
const appName = brand.name;

// The layouts carry the signed-in shell: sidebar, menus, live notifications
// (pusher-js + laravel-echo). The public home page uses none of it, so it is
// split out of the entry bundle and fetched the first time an app or auth page
// renders, instead of on every visit to the home page.
const loadAppLayout = () => import('@/layouts/app-layout');
const loadAuthLayout = () => import('@/layouts/auth-layout');
const loadSettingsLayout = () => import('@/layouts/settings/layout');
const AppLayout = lazy(loadAppLayout);
const AuthLayout = lazy(loadAuthLayout);
const SettingsLayout = lazy(loadSettingsLayout);

createInertiaApp({
    // A title that already names the venue (the home page's SEO title) is used as-is.
    title: (title) => (!title ? appName : title.includes(appName) ? title : `${title} - ${appName}`),
    layout: (name) => {
        switch (true) {
            case name === 'welcome':
            case name.startsWith('errors/'):
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
                {/* Covers the one-time fetch of a layout chunk; a blank screen, not a spinner, since it's brief. */}
                <Suspense fallback={<div className="min-h-svh" />}>{app}</Suspense>
                <Toaster />
                <PwaInstallPrompt />
                <NavigationLoader />
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

// Page-enter animations play between pages, never on the first load (see app.css).
router.on('start', () => document.documentElement.setAttribute('data-navigated', ''));

// Warm the layout chunks once the page has finished loading and the browser is
// idle, so the first click into the app doesn't wait on them, without competing
// with the first paint for bandwidth.
window.addEventListener(
    'load',
    () => {
        const warm = () => void Promise.all([loadAppLayout(), loadAuthLayout(), loadSettingsLayout()]);

        if ('requestIdleCallback' in window) {
            window.requestIdleCallback(warm, { timeout: 5000 });
        } else {
            setTimeout(warm, 2000);
        }
    },
    { once: true },
);

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
