export const brand = {
    name: 'Galaang-Ramos Pickleball',
    tagline: 'Est. 2026',
    // 512px copy of public/logos.png (290 KB vs 1.7 MB); the logo is never
    // shown larger than ~290px. logos.png itself stays for og:image shares.
    logo: '/pwa-512.png',
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
