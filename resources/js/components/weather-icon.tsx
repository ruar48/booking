import {
    Cloud,
    CloudDrizzle,
    CloudFog,
    CloudLightning,
    CloudRain,
    CloudSun,
    Snowflake,
    Sun,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { WeatherIcon as WeatherIconName } from '@/types/booking';

/**
 * Shared so the booking calendar and the court schedule grid can't drift into
 * showing different icons or colours for the same condition.
 */
export const WEATHER_ICONS: Record<
    WeatherIconName,
    { Icon: LucideIcon; className: string }
> = {
    clear: { Icon: Sun, className: 'text-amber-500' },
    partly: { Icon: CloudSun, className: 'text-amber-500' },
    cloudy: { Icon: Cloud, className: 'text-slate-400' },
    fog: { Icon: CloudFog, className: 'text-slate-400' },
    drizzle: { Icon: CloudDrizzle, className: 'text-sky-500' },
    rain: { Icon: CloudRain, className: 'text-sky-600' },
    showers: { Icon: CloudRain, className: 'text-sky-600' },
    snow: { Icon: Snowflake, className: 'text-sky-300' },
    storm: { Icon: CloudLightning, className: 'text-violet-500' },
};

export function WeatherIcon({
    icon,
    className,
}: {
    icon: WeatherIconName;
    className?: string;
}) {
    const { Icon, className: toneClassName } =
        WEATHER_ICONS[icon] ?? WEATHER_ICONS.cloudy;

    return <Icon className={cn('shrink-0', toneClassName, className)} />;
}
