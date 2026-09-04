import inertia from '@inertiajs/vite';
import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { bunny } from 'laravel-vite-plugin/fonts';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
            fonts: [
                bunny('Instrument Sans', {
                    weights: [400, 500, 600],
                }),
            ],
        }),
        inertia(),
        react({
            babel: {
                plugins: ['babel-plugin-react-compiler'],
            },
        }),
        tailwindcss(),
        wayfinder({
            formVariants: true,
        }),
        VitePWA({
            registerType: 'autoUpdate',
            injectRegister: false,
            outDir: 'public',
            includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon.png'],
            manifest: {
                name: 'Booking',
                short_name: 'Booking',
                description: 'Booking',
                start_url: '/',
                scope: '/',
                display: 'standalone',
                background_color: '#ffffff',
                theme_color: '#0f2847',
                icons: [
                    {
                        src: '/logos.png',
                        sizes: '192x192',
                        type: 'image/png',
                    },
                    {
                        src: '/logos.png',
                        sizes: '512x512',
                        type: 'image/png',
                    },
                    {
                        src: '/logos.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable',
                    },
                ],
            },
            workbox: {
                // This app is server-rendered per route (Blade/Inertia), not a single-page
                // app with one index.html — disable the SPA navigation fallback so the
                // service worker only precaches static build assets and never intercepts
                // page navigations.
                navigateFallback: null,
                globPatterns: ['**/*.{js,css,ico,png,svg,woff2}'],
            },
            // The dev service worker would be served by Vite (:5173) while the
            // app is served by Laravel (:8000); a service worker must be
            // same-origin, so it can never register in dev. app.tsx registers
            // only in production to match.
            devOptions: {
                enabled: false,
            },
        }),
    ],
});
