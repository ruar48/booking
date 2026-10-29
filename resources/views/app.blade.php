<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
        <meta name="theme-color" content="#0f2847">

        <meta property="og:site_name" content="{{ config('app.name', 'Laravel') }}">

        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: oklch(1 0 0);
            }

            html.dark {
                background-color: oklch(0.145 0 0);
            }
        </style>

        {{-- All generated from public/logos.png. Bump ?v= when the logo
             changes: browsers cache favicons far longer than other assets. --}}
        <link rel="icon" href="/favicon.ico?v=2" sizes="48x48">
        <link rel="icon" href="/favicon-32.png?v=2" type="image/png" sizes="32x32">
        <link rel="icon" href="/pwa-192.png?v=2" type="image/png" sizes="192x192">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=2">
        <link rel="manifest" href="/build/manifest.webmanifest">
        <meta name="mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="default">
        <meta name="apple-mobile-web-app-title" content="{{ config('app.name', 'Laravel') }}">

        @fonts

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        {{-- Used only when the SSR server is down: SSR prints the page's own <Head>
             tags (built from the same $seo props) in place of this slot. Pages that
             pass $seo (the home page) get their title, description and schema.org
             data here so crawlers still see them in the HTML without running
             JavaScript. `data-inertia` hands each tag to Inertia's head manager,
             which swaps it for the page's <Head> tags once React loads. --}}
        <x-inertia::head>
            @php
                $seoTitle = $seo['title'] ?? config('app.name', 'Laravel');
                $seoDescription = $seo['description'] ?? 'Book pickleball courts and billiards tables online at '.config('app.name', 'Laravel').'. Real-time availability, instant confirmation, open play sessions.';
            @endphp
            <title data-inertia>{{ $seoTitle }}</title>
            <meta name="description" content="{{ $seoDescription }}" data-inertia>
            <link rel="canonical" href="{{ url()->current() }}" data-inertia>

            <meta property="og:type" content="website" data-inertia>
            <meta property="og:url" content="{{ url()->current() }}" data-inertia>
            <meta property="og:title" content="{{ $seoTitle }}" data-inertia>
            <meta property="og:description" content="{{ $seoDescription }}" data-inertia>
            <meta property="og:image" content="{{ asset('logos.png') }}" data-inertia>

            <meta name="twitter:card" content="summary" data-inertia>
            <meta name="twitter:title" content="{{ $seoTitle }}" data-inertia>
            <meta name="twitter:description" content="{{ $seoDescription }}" data-inertia>
            <meta name="twitter:image" content="{{ asset('logos.png') }}" data-inertia>

            {{-- The hero photo (heroImage in pages/welcome.tsx) is the largest thing on
                 the first screen; without this the browser only finds it once React runs. --}}
            @if (($page['component'] ?? null) === 'welcome')
                <link rel="preload" as="image" href="/bg.webp" fetchpriority="high" data-inertia>
            @endif

            @isset($seo['structured_data'])
                <script type="application/ld+json" data-inertia>@json($seo['structured_data'], JSON_UNESCAPED_SLASHES | JSON_HEX_TAG)</script>
            @endisset
        </x-inertia::head>
    </head>
    <body class="font-sans antialiased">
        <x-inertia::app />
    </body>
</html>
