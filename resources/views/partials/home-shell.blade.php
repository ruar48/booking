{{--
    Server-rendered first screen of the home page, shown until React mounts and
    replaces it (see App\View\Components\InertiaApp). Two jobs:

    - Crawlers that don't run JavaScript (SEO tools, AI assistants, some search
      bots) get the real heading, location, description, contact details and
      links instead of an empty page.
    - Phones paint the hero straight from the HTML instead of a blank screen
      while the JavaScript downloads.

    The header and hero mirror SiteHeader and Hero in resources/js/pages/welcome.tsx
    class for class, so the swap to React is seamless. If you change those, change
    this too. Below the hero is a plain summary, only on screen for that moment.
--}}
@php
    $props = $page['props'] ?? [];
    $venue = $props['venue'] ?? [];
    $seo = $props['seo'] ?? [];
    $user = $props['auth']['user'] ?? null;
    $name = config('app.name');
    $split = strrpos($name, ' ');
    [$first, $last] = $split === false ? [$name, ''] : [substr($name, 0, $split), substr($name, $split + 1)];
    $fallback = 'A place where you can enjoy playing pickleball with your friends, family, and fellow players. Whether you are a beginner or an experienced player, everyone is welcome to play, have fun, stay active, and enjoy the game together.';
    $paragraphs = array_values(array_filter(array_map('trim', explode("\n", $venue['description'] ?? $fallback))));
    $accountUrl = $user ? (($user['isVenueAdmin'] ?? false) ? route('dashboard') : route('bookings.index')) : route('login');
    // No display class here: each button sets its own (inline-flex / hidden), since
    // plain HTML has no tailwind-merge to drop the conflicting one as React's cn() does.
    $outline = 'items-center justify-center gap-2 whitespace-nowrap text-sm font-medium h-10 rounded-lg border border-white/70 bg-transparent px-4 text-white';
    $svg = 'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
@endphp

<div class="min-h-screen overflow-x-clip bg-slate-100 text-brand-navy">
    <header class="sticky top-0 z-40 border-b border-white/10 bg-brand-navy-dark/95 text-white backdrop-blur-md">
        <div class="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:h-[4.5rem] sm:px-6 lg:px-8">
            <a href="{{ url('/') }}" class="flex min-w-0 items-center gap-3">
                <img src="/logo.webp" alt="{{ $name }}" width="48" height="48" class="size-10 shrink-0 object-contain sm:size-12">
                <span class="hidden sm:block">
                    <span class="flex flex-col text-left text-base leading-[1.1] font-bold tracking-tight sm:text-lg">
                        <span class="text-white">{{ $first }}</span>
                        @if ($last)<span class="text-brand-lime">{{ $last }}</span>@endif
                    </span>
                </span>
            </a>

            <div class="flex shrink-0 items-center gap-2 sm:gap-3">
                <button type="button" class="{{ $outline }} inline-flex px-2.5 sm:hidden" aria-label="Install app">
                    <svg {!! $svg !!} class="size-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                </button>
                <button type="button" class="{{ $outline }} hidden sm:inline-flex">
                    <svg {!! $svg !!} class="size-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                    Install app
                </button>
                <a href="{{ $accountUrl }}" class="{{ $outline }} inline-flex">
                    <svg {!! $svg !!} class="size-4"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>
                    <span class="hidden sm:inline">{{ $user ? 'My account' : 'Login' }}</span>
                </a>
                <a href="#explore" class="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-lime px-4 text-sm font-bold whitespace-nowrap text-brand-navy">
                    <svg {!! $svg !!} class="size-4"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
                    <span class="hidden sm:inline">Book a Court</span>
                    <span class="sm:hidden">Book</span>
                </a>
            </div>
        </div>
    </header>

    <main>
        <section class="relative overflow-hidden bg-brand-navy-dark text-white">
            <img src="/bg.webp" srcset="/bg-1080.webp 1080w, /bg.webp 1672w" sizes="100vw" alt="" fetchpriority="high" class="absolute inset-0 size-full object-cover object-[70%_center]">
            <div class="absolute inset-0 bg-gradient-to-r from-brand-navy-dark/95 via-brand-navy-dark/70 to-brand-navy-dark/5"></div>
            <div class="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-brand-navy-dark/60 to-transparent"></div>

            <div class="pointer-events-none absolute top-8 right-6 hidden flex-col items-end md:flex lg:right-10">
                <img src="/logo.webp" alt="" width="176" height="176" class="size-36 object-contain drop-shadow-[0_16px_32px_rgba(0,0,0,0.55)] lg:size-44">
                <div class="mt-3 mr-2 -rotate-12 text-right font-script text-2xl leading-tight text-brand-lime drop-shadow-lg lg:text-3xl" aria-hidden="true">
                    <p class="mr-8">Play Hard</p>
                    <p>Stay Connected</p>
                </div>
            </div>

            <div class="relative mx-auto max-w-7xl px-4 pt-10 pb-28 sm:px-6 sm:pt-14 lg:px-8 lg:pt-16 lg:pb-32">
                <div class="max-w-xl">
                    <span class="inline-flex items-center rounded-full bg-brand-lime px-3.5 py-1 text-xs font-bold text-brand-navy sm:text-sm">
                        Play • Connect • Belong
                    </span>
                    <h1 class="mt-5 text-4xl leading-[1.05] font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                        Welcome to
                        <span class="block text-brand-lime">{{ $first }}</span>
                        @if ($last)<span class="block text-brand-lime">{{ $last }}</span>@endif
                    </h1>
                    @if (! empty($seo['location']))
                        <p class="mt-4 flex items-start gap-1.5 text-sm font-semibold text-white sm:text-base">
                            <svg {!! $svg !!} class="mt-0.5 size-4 shrink-0 text-brand-lime sm:mt-1"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
                            Pickleball courts &amp; billiards in {{ $seo['location'] }}
                        </p>
                    @endif
                    <p class="mt-5 line-clamp-4 text-sm leading-relaxed text-white/85 sm:text-base">{{ $paragraphs[0] ?? $fallback }}</p>
                    <div class="mt-8 flex flex-wrap gap-3 sm:gap-4">
                        <a href="#explore" class="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-lime px-6 text-sm font-bold whitespace-nowrap text-brand-navy">
                            <svg {!! $svg !!} class="size-4"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
                            Book a Court
                            <svg {!! $svg !!} class="size-4"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                        </a>
                        <a href="#open-play" class="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/70 bg-brand-navy-dark/30 px-6 text-sm font-semibold whitespace-nowrap text-white">
                            <svg {!! $svg !!} class="size-4"><path d="M18 21a8 8 0 0 0-16 0"/><circle cx="10" cy="8" r="5"/><path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3"/></svg>
                            Explore Open Play
                        </a>
                    </div>
                </div>
            </div>
        </section>

        <section class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <h2 class="text-2xl font-bold">About {{ $name }}</h2>
            @foreach ($paragraphs as $paragraph)
                <p class="mt-3 max-w-3xl leading-relaxed text-slate-600">{{ $paragraph }}</p>
            @endforeach

            <h2 class="mt-8 text-xl font-bold">Visit or contact us</h2>
            <ul class="mt-3 space-y-1 text-slate-600">
                @if (! empty($seo['location']))<li>{{ $seo['location'] }}@if (! empty($venue['postal_code'])), {{ $venue['postal_code'] }}@endif</li>@endif
                @if (! empty($venue['phone']))<li><a href="tel:{{ preg_replace('/[^\d+]/', '', $venue['phone']) }}" class="underline">{{ $venue['phone'] }}</a></li>@endif
                @if (! empty($venue['email']))<li><a href="mailto:{{ $venue['email'] }}" class="underline">{{ $venue['email'] }}</a></li>@endif
            </ul>

            <p class="mt-8 flex flex-wrap gap-4 font-semibold">
                <a href="{{ route('login') }}" class="underline">Log in to book a court</a>
                <a href="{{ route('register') }}" class="underline">Create an account</a>
            </p>
        </section>
    </main>
</div>
