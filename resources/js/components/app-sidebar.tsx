import { Link } from '@inertiajs/react';
import { ChevronRight, LifeBuoy } from 'lucide-react';

import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { useNavItems } from '@/hooks/use-nav-items';
import { home } from '@/routes';

export function AppSidebar() {
    const { homeHref, mainNavItems, manageNavItems, adminNavItems } =
        useNavItems();
    const { state } = useSidebar();

    return (
        <Sidebar collapsible="icon" variant="sidebar">
            <SidebarHeader className="border-sidebar-border border-b">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            asChild
                            className="hover:bg-transparent active:bg-transparent"
                        >
                            <Link href={homeHref} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="gap-1 py-2">
                <NavMain label="Main" items={mainNavItems} />
                {manageNavItems.length > 0 && (
                    <NavMain label="Manage" items={manageNavItems} />
                )}
                {adminNavItems.length > 0 && (
                    <NavMain label="Owner" items={adminNavItems} />
                )}
            </SidebarContent>

            <SidebarFooter className="gap-2">
                {/* Hidden when collapsed to the icon rail, where there is no
                    room for the copy and the card would render as a stray
                    floating box. */}
                {state === 'expanded' && <SupportCard />}
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

function SupportCard() {
    return (
        <Link
            href={home()}
            className="border-sidebar-border hover:bg-sidebar-accent group/support flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors"
        >
            <div className="bg-sidebar-accent text-sidebar-accent-foreground group-hover/support:bg-sidebar flex size-8 shrink-0 items-center justify-center rounded-full transition-colors">
                <LifeBuoy className="size-4" />
            </div>
            <div className="grid flex-1 text-left">
                <span className="text-sidebar-accent-foreground truncate text-xs font-semibold">
                    Need help?
                </span>
                <span className="text-muted-foreground truncate text-xs">
                    Contact our support
                </span>
            </div>
            <ChevronRight className="text-muted-foreground size-4 shrink-0" />
        </Link>
    );
}
