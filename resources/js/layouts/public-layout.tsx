import { usePage } from '@inertiajs/react';
import { Mail, Phone } from 'lucide-react';

import { LegalLinks } from '@/components/legal-links';
import { MessengerWidget } from '@/components/messenger-widget';
import { SiteHeader, Wordmark } from '@/components/site-header';
import { brand } from '@/lib/brand';

/**
 * The public site's frame for pages other than home (FAQ, Terms, Privacy):
 * the same header as the home page and a footer with the venue's contact
 * details and the legal links.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
    const { support } = usePage().props;

    return (
        <div className="flex min-h-screen flex-col bg-slate-100 text-brand-navy">
            <SiteHeader />

            <main className="animate-page-enter flex-1">{children}</main>

            <footer className="bg-brand-navy-dark text-white print:hidden">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <img src={brand.logo} alt="" className="size-12 object-contain" />
                            <Wordmark size="lg" />
                        </div>
                        {support?.phone || support?.email ? (
                            <ul className="space-y-1.5 text-sm text-white/80">
                                {support.phone ? (
                                    <li className="flex items-center gap-2">
                                        <Phone className="size-4 text-brand-lime" />
                                        <a href={`tel:${support.phone.replace(/[^\d+]/g, '')}`} className="hover:text-brand-lime">
                                            {support.phone}
                                        </a>
                                    </li>
                                ) : null}
                                {support.email ? (
                                    <li className="flex items-center gap-2">
                                        <Mail className="size-4 text-brand-lime" />
                                        <a href={`mailto:${support.email}`} className="hover:text-brand-lime">
                                            {support.email}
                                        </a>
                                    </li>
                                ) : null}
                            </ul>
                        ) : null}
                    </div>
                    <div className="flex flex-col items-center gap-3 border-t border-white/10 pt-5 pb-24 text-xs text-white/60 sm:flex-row sm:justify-between sm:pr-20 sm:pb-5">
                        <p>
                            &copy; {new Date().getFullYear()} {brand.name}. All rights reserved.
                        </p>
                        <LegalLinks className="justify-center" linkClassName="hover:text-white" />
                    </div>
                </div>
            </footer>

            <MessengerWidget avoidBottomNav={false} />
        </div>
    );
}
