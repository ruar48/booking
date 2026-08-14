export const ANNOUNCEMENT_TYPES = [
    { value: 'general', label: 'General / News' },
    { value: 'open_play', label: 'Open Play / Event' },
    { value: 'discount', label: 'Discount / Promo' },
    { value: 'maintenance', label: 'Maintenance / Closure' },
] as const;

export type AnnouncementTypeValue = (typeof ANNOUNCEMENT_TYPES)[number]['value'];

const TONE_CLASSES: Record<AnnouncementTypeValue, string> = {
    general: 'bg-primary/10 text-primary border-primary/20',
    open_play: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20',
    discount: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    maintenance: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
};

export function announcementTypeLabel(type: string): string {
    return ANNOUNCEMENT_TYPES.find((t) => t.value === type)?.label ?? type;
}

export function announcementTypeToneClasses(type: string): string {
    return TONE_CLASSES[type as AnnouncementTypeValue] ?? 'bg-muted text-muted-foreground border-border';
}
