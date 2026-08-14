import { Link } from '@inertiajs/react';
import { Monitor, Palette, ShieldCheck, User } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import Heading from '@/components/heading';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';
import { edit } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import { index as sessionsIndex } from '@/routes/sessions';
import type { NavItem } from '@/types';

const sidebarNavItems: NavItem[] = [
    {
        title: 'Profile',
        href: edit(),
        icon: User,
    },
    {
        title: 'Security',
        href: editSecurity(),
        icon: ShieldCheck,
    },
    {
        title: 'Appearance',
        href: editAppearance(),
        icon: Palette,
    },
    {
        title: 'Sessions',
        href: sessionsIndex(),
        icon: Monitor,
    },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();

    return (
        <div className="px-4 py-6">
            <div className="mb-8 flex items-center gap-3">
                <div className="bg-brand-navy/10 text-brand-navy flex size-10 shrink-0 items-center justify-center rounded-lg">
                    <User className="size-5" />
                </div>
                <Heading
                    title="Settings"
                    description="Manage your profile and account settings"
                />
            </div>

            <div className="flex flex-col lg:flex-row lg:space-x-8">
                <aside className="w-full max-w-xl lg:w-52">
                    <nav
                        className="flex flex-col gap-1"
                        aria-label="Settings"
                    >
                        {sidebarNavItems.map((item, index) => {
                            const active = isCurrentOrParentUrl(item.href);

                            return (
                                <Link
                                    key={`${toUrl(item.href)}-${index}`}
                                    href={item.href}
                                    className={cn(
                                        'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                        active
                                            ? 'bg-brand-navy text-white shadow-sm'
                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                    )}
                                >
                                    {item.icon && (
                                        <item.icon className="size-4 shrink-0" />
                                    )}
                                    {item.title}
                                </Link>
                            );
                        })}
                    </nav>
                </aside>

                <Separator className="my-6 lg:hidden" />

                <div className="flex-1 md:max-w-2xl">
                    <Card className="relative overflow-hidden p-6">
                        <div className="bg-brand-navy/5 pointer-events-none absolute -top-16 -right-16 size-48 rounded-full" />

                        <section className="relative space-y-12">
                            {children}
                        </section>
                    </Card>
                </div>
            </div>
        </div>
    );
}
