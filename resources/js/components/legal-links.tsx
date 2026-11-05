import { Link } from '@inertiajs/react';

import { openCookieSettings } from '@/lib/cookie-consent';
import { cn } from '@/lib/utils';
import { faq } from '@/routes';
import { privacy, terms } from '@/routes/legal';

/**
 * FAQ, Terms, Privacy and Cookie settings. Shown on the public pages, the
 * sign-in pages and in the app, so the legal pages are never more than one
 * click away and cookie choices can be changed from anywhere.
 */
export function LegalLinks({ className, linkClassName }: { className?: string; linkClassName?: string }) {
    const item = cn('underline-offset-4 transition-colors hover:underline', linkClassName);

    return (
        <nav aria-label="Help and legal" className={cn('flex flex-wrap items-center gap-x-4 gap-y-1', className)}>
            <Link href={faq()} className={item}>
                FAQ
            </Link>
            <Link href={terms()} className={item}>
                Terms of Service
            </Link>
            <Link href={privacy()} className={item}>
                Privacy Notice
            </Link>
            <button type="button" onClick={openCookieSettings} className={cn(item, 'cursor-pointer')}>
                Cookie settings
            </button>
        </nav>
    );
}
