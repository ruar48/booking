/**
 * Mirror of App\Enums\Sport. Array order is the display order (schedule tabs,
 * filters, stats) and must match the enum's case order.
 */
export const SPORTS = [
    { value: 'pickleball', label: 'Pickleball', unit: 'courts' },
    { value: 'billiards', label: 'Billiard', unit: 'tables' },
    { value: 'table_tennis', label: 'Table Tennis', unit: 'tables' },
    { value: 'pickle_range', label: 'Pickle Range', unit: 'stations' },
] as const;

export type SportValue = (typeof SPORTS)[number]['value'];

export function sportLabel(sport: string): string {
    return SPORTS.find((s) => s.value === sport)?.label ?? sport;
}

/** Plural noun for a sport's resources: "courts", "tables", "stations". */
export function sportUnit(sport: string): string {
    return SPORTS.find((s) => s.value === sport)?.unit ?? 'courts';
}

/** Sort comparator that orders sports by their enum position. */
export function compareSports(a: string, b: string): number {
    const rank = (s: string) => {
        const index = SPORTS.findIndex((x) => x.value === s);

        return index === -1 ? SPORTS.length : index;
    };

    return rank(a) - rank(b);
}
