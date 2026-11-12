import { Layers, Trophy } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export type OpenPlayFormatValues = {
    format: string;
    skill_level: string;
    team_size: string;
    bracket_format: string;
    bracket_generation: string;
};

type Field = keyof OpenPlayFormatValues;

const FORMATS: { value: string; label: string; description: string; icon: LucideIcon }[] = [
    {
        value: 'paddle_stacking',
        label: 'Paddle stacking',
        description:
            'Classic open play. Players stack their paddles, and the next group in line takes the next free court. No bracket.',
        icon: Layers,
    },
    {
        value: 'bracket',
        label: 'Bracket (tournament)',
        description: 'Round robin or elimination, with fixed entries and recorded scores.',
        icon: Trophy,
    },
];

/**
 * The "Format" section of the open play create and edit forms. Bracket
 * settings only apply to bracket sessions, so they hide for paddle stacking.
 */
export function OpenPlayFormatFields({
    values,
    onChange,
    errors,
}: {
    values: OpenPlayFormatValues;
    onChange: (field: Field, value: string) => void;
    errors: Partial<Record<Field, string>>;
}) {
    const paddleStacking = values.format === 'paddle_stacking';

    return (
        <>
            <div className="grid gap-2 sm:col-span-2">
                <Label id="format-label">Play format</Label>
                <div role="radiogroup" aria-labelledby="format-label" className="grid gap-3 sm:grid-cols-2">
                    {FORMATS.map((option) => {
                        const selected = values.format === option.value;
                        const Icon = option.icon;

                        return (
                            <button
                                key={option.value}
                                type="button"
                                role="radio"
                                aria-checked={selected}
                                onClick={() => onChange('format', option.value)}
                                className={cn(
                                    'rounded-lg border p-3 text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                                    selected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted',
                                )}
                            >
                                <span className="flex items-center gap-2 text-sm font-semibold">
                                    <Icon className="size-4" />
                                    {option.label}
                                </span>
                                <span className="mt-1 block text-xs text-muted-foreground">{option.description}</span>
                            </button>
                        );
                    })}
                </div>
                <InputError message={errors.format} />
            </div>

            <div className="grid gap-2">
                <Label>Skill level</Label>
                <Select value={values.skill_level} onValueChange={(v) => onChange('skill_level', v)}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all_levels">All levels</SelectItem>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                </Select>
                <InputError message={errors.skill_level} />
            </div>
            <div className="grid gap-2">
                <Label>Match type</Label>
                <Select value={values.team_size} onValueChange={(v) => onChange('team_size', v)}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="doubles">
                            {paddleStacking ? '2v2 Doubles — 4 players per court' : '2v2 (Doubles)'}
                        </SelectItem>
                        <SelectItem value="singles">
                            {paddleStacking ? '1v1 Singles — 2 players per court' : '1v1 (Singles)'}
                        </SelectItem>
                    </SelectContent>
                </Select>
                <InputError message={errors.team_size} />
            </div>

            {paddleStacking ? (
                <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground sm:col-span-2">
                    Players register on their own (no fixed partners). On the day they stack their paddle from
                    their phone or at the counter, and you tap <strong>Game done</strong> on the Manage page when a
                    court finishes. The players rotate across the courts you reserve under <strong>Courts</strong>.
                </p>
            ) : (
                <>
                    <div className="grid gap-2">
                        <Label>Bracket format</Label>
                        <Select value={values.bracket_format} onValueChange={(v) => onChange('bracket_format', v)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="round_robin">Round robin</SelectItem>
                                <SelectItem value="single_elimination">Single elimination</SelectItem>
                                <SelectItem value="double_elimination">Double elimination</SelectItem>
                            </SelectContent>
                        </Select>
                        <InputError message={errors.bracket_format} />
                    </div>
                    <div className="grid gap-2">
                        <Label>Matchup generation</Label>
                        <Select
                            value={values.bracket_generation}
                            onValueChange={(v) => onChange('bracket_generation', v)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="automatic">Automatic (seeded by registration order)</SelectItem>
                                <SelectItem value="random">Random draw</SelectItem>
                                <SelectItem value="manual">Manual (I&apos;ll set up matchups myself)</SelectItem>
                            </SelectContent>
                        </Select>
                        <InputError message={errors.bracket_generation} />
                    </div>
                </>
            )}
        </>
    );
}
