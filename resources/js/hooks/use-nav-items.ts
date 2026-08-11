import {
    Calendar,
    CalendarClock,
    CalendarDays,
    CreditCard,
    Dumbbell,
    LayoutGrid,
    MapPin,
    Megaphone,
    Package,
    Receipt,
    Settings,
    Users,
} from 'lucide-react';

import { useIsVenueAdmin } from '@/hooks/use-is-venue-admin';
import { dashboard } from '@/routes';
import { index as adminSettingsIndex } from '@/routes/admin/settings';
import { index as announcementsIndex } from '@/routes/announcements';
import { calendar as bookingsCalendar, create as createBooking, index as bookingsIndex } from '@/routes/bookings';
import { browse as openPlayBrowse, index as openPlayIndex } from '@/routes/open-play';
import { index as paymentsIndex } from '@/routes/payments';
import { index as playersIndex } from '@/routes/players';
import { checkout as posCheckout } from '@/routes/pos';
import { index as productsIndex } from '@/routes/products';
import { index as rentalItemsIndex } from '@/routes/rental-items';
import { browse as rentalsBrowse } from '@/routes/rentals';
import { index as resourcesIndex } from '@/routes/resources';
import type { NavItem } from '@/types';

export type NavItems = {
    homeHref: NavItem['href'];
    mainNavItems: NavItem[];
    manageNavItems: NavItem[];
    adminNavItems: NavItem[];
};

export function useNavItems(): NavItems {
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
              { title: 'Open play', href: openPlayBrowse(), icon: CalendarClock },
              { title: 'Rentals', href: rentalsBrowse(), icon: Dumbbell },
          ];

    const manageNavItems: NavItem[] = isVenueAdmin
        ? [
              { title: 'Resources', href: resourcesIndex(), icon: MapPin },
              { title: 'Inventory', href: productsIndex(), icon: Package },
              { title: 'POS', href: posCheckout(), icon: Receipt },
              { title: 'Rentals', href: rentalItemsIndex(), icon: Dumbbell },
              { title: 'Members', href: playersIndex(), icon: Users },
              { title: 'Open play', href: openPlayIndex(), icon: CalendarClock },
              { title: 'Announcements', href: announcementsIndex(), icon: Megaphone },
              { title: 'Payments', href: paymentsIndex(), icon: CreditCard },
          ]
        : [];

    const adminNavItems: NavItem[] = isVenueAdmin
        ? [{ title: 'Venue Settings', href: adminSettingsIndex(), icon: Settings }]
        : [];

    return { homeHref, mainNavItems, manageNavItems, adminNavItems };
}
