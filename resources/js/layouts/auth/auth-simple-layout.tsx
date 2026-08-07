import { Link } from '@inertiajs/react';
import { BrandLogo } from '@/components/brand-logo';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted/40 p-6 md:p-10">
            <div className="w-full max-w-sm">
                <div className="flex flex-col items-center gap-2 pb-8">
                    <Link
                        href={home()}
                        className="flex flex-col items-center gap-3 font-medium"
                    >
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl border bg-card p-2 shadow-sm">
                            <BrandLogo imageClassName="size-full" />
                        </div>
                        <span className="sr-only">{title}</span>
                    </Link>
                </div>

                <div className="flex flex-col gap-6 rounded-2xl border bg-card p-8 shadow-sm">
                    <div className="space-y-1.5 text-center">
                        <h1 className="text-xl font-semibold tracking-tight">
                            {title}
                        </h1>
                        <p className="text-center text-sm text-muted-foreground">
                            {description}
                        </p>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
