import { Link } from '@inertiajs/react';
import {
    Calendar,
    CalendarClock,
    CalendarDays,
    CreditCard,
    LayoutGrid,
    MapPin,
    Megaphone,
    Settings,
    Users,
} from 'lucide-react';

import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
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
} from '@/components/ui/sidebar';
import { useIsVenueAdmin } from '@/hooks/use-is-venue-admin';
import { index as adminSettingsIndex } from '@/routes/admin/settings';
import { index as announcementsIndex } from '@/routes/announcements';
import { calendar as bookingsCalendar, create as createBooking, index as bookingsIndex } from '@/routes/bookings';
import { index as courtsIndex } from '@/routes/courts';
import { dashboard } from '@/routes';
import { index as openPlayIndex } from '@/routes/open-play';
import { index as paymentsIndex } from '@/routes/payments';
import { index as playersIndex } from '@/routes/players';
import type { NavItem } from '@/types';

export function AppSidebar() {
    const isVenueAdmin = useIsVenueAdmin();

    const homeHref = isVenueAdmin ? dashboard() : bookingsIndex();

    const mainNavItems: NavItem[] = isVenueAdmin
        ? [
              { title: 'Dashboard', href: dashboard(), icon: LayoutGrid },
              { title: 'Bookings', href: bookingsIndex(), icon: Calendar },
              { title: 'Calendar', href: bookingsCalendar(), icon: CalendarDays },
          ]
        : [
              { title: 'My bookings', href: bookingsIndex(), icon: Calendar },
              { title: 'Book a court', href: createBooking(), icon: CalendarDays },
          ];

    const manageNavItems: NavItem[] = isVenueAdmin
        ? [
              { title: 'Courts', href: courtsIndex(), icon: MapPin },
              { title: 'Members', href: playersIndex(), icon: Users },
              { title: 'Open play', href: openPlayIndex(), icon: CalendarClock },
              { title: 'Announcements', href: announcementsIndex(), icon: Megaphone },
              { title: 'Payments', href: paymentsIndex(), icon: CreditCard },
          ]
        : [];

    const adminNavItems: NavItem[] = isVenueAdmin
        ? [{ title: 'Venue Settings', href: adminSettingsIndex(), icon: Settings }]
        : [];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={homeHref} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain label="Main" items={mainNavItems} />
                {manageNavItems.length > 0 && (
                    <NavMain label="Manage" items={manageNavItems} />
                )}
                {adminNavItems.length > 0 && (
                    <NavMain label="Owner" items={adminNavItems} />
                )}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
