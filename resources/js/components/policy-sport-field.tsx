import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { SPORTS } from '@/lib/sport';
import type { SportValue } from '@/lib/sport';

const ALL_SPORTS = 'all';

/**
 * Which sport a court-rules policy applies to. "All sports" rules show on
 * every sport's booking page; a sport's own rules only when it is selected.
 */
export function PolicySportField({
    value,
    onChange,
    error,
}: {
    value: SportValue | null;
    onChange: (sport: SportValue | null) => void;
    error?: string;
}) {
    return (
        <div className="grid gap-2">
            <Label>Applies to</Label>
            <Select
                value={value ?? ALL_SPORTS}
                onValueChange={(v) => onChange(v === ALL_SPORTS ? null : (v as SportValue))}
            >
                <SelectTrigger>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={ALL_SPORTS}>All sports (house rules)</SelectItem>
                    {SPORTS.map((sport) => (
                        <SelectItem key={sport.value} value={sport.value}>
                            {sport.label} only
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
                The booking and home pages show the selected sport&apos;s rules, followed by the house rules.
            </p>
            <InputError message={error} />
        </div>
    );
}
