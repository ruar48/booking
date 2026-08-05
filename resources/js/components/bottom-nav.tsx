import { Link } from '@inertiajs/react';
import { Menu } from 'lucide-react';

import { useSidebar } from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useNavItems } from '@/hooks/use-nav-items';
import { cn } from '@/lib/utils';

export function BottomNav() {
    const { mainNavItems } = useNavItems();
    const { isCurrentUrl } = useCurrentUrl();
    const { toggleSidebar } = useSidebar();

    const tabs = mainNavItems.slice(0, 4);

    return (
        <nav
            className="fixed inset-x-0 bottom-0 z-40 flex border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
            aria-label="Primary"
        >
            {tabs.map((item) => {
                const active = isCurrentUrl(item.href);

                return (
                    <Link
                        key={item.title}
                        href={item.href}
                        prefetch
                        className={cn(
                            'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium text-muted-foreground',
                            active && 'text-primary',
                        )}
                    >
                        {item.icon && <item.icon className={cn('size-5', active && 'text-primary')} />}
                        <span>{item.title}</span>
                    </Link>
                );
            })}

            <button
                type="button"
                onClick={toggleSidebar}
                className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium text-muted-foreground"
            >
                <Menu className="size-5" />
                <span>More</span>
            </button>
        </nav>
    );
}
