export const brand = {
    name: 'Galaang-Ramos Pickleball',
    tagline: 'Est. 2026',
    // 384px WebP of public/logos.png (43 KB vs 1.7 MB): sharp at 2x for the
    // largest place it's shown (~192px). Link previews use shareImage, a PNG,
    // since not every social crawler reads WebP.
    logo: '/logo.webp',
    shareImage: '/pwa-512.png',
    colors: {
        navy: '#0f2847',
        navyLight: '#1a3a5c',
        navyDark: '#0a1c30',
        lime: '#d4ed2a',
        limeDark: '#b8d420',
        court: '#4a7fa8',
        courtLight: '#6a9fc4',
        black: '#0a0a0a',
    },
} as const;
