import { router } from '@inertiajs/react';
import { Check, Minus, Pencil, Plus, Trophy } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    bracketSlotLabel,
    entryLabel,
    finalMatchLabel,
    groupByRound,
    losersBracketRoundHeights,
    losersRoundLabel,
    matchesByBracketSide,
    roundLabel,
} from '@/lib/open-play';
import { cn } from '@/lib/utils';
import { update as updateBracketMatch } from '@/routes/open-play/bracket-matches';
import { updateScore } from '@/routes/open-play/matches';
import type { OpenPlayMatch, OpenPlayRegistration } from '@/types/booking';

// Sentinel for "no entry in this slot yet" — Radix's Select can't take an
// empty string as an item value, so we map this to `null` on save instead.
export const EMPTY_SLOT = '__empty__';

// Shared by the round-robin/manual table rows and the elimination bracket
// cards: lets the organizer hand-pick either slot of any not-yet-completed
// match, regardless of whether the bracket was generated automatically,
// randomly, or built manually.
export function useMatchupEditor(match: OpenPlayMatch) {
    const [editing, setEditing] = useState(false);
    const [entry1Id, setEntry1Id] = useState(match.entry1_id ? String(match.entry1_id) : EMPTY_SLOT);
    const [entry2Id, setEntry2Id] = useState(match.entry2_id ? String(match.entry2_id) : EMPTY_SLOT);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const start = () => {
        setEntry1Id(match.entry1_id ? String(match.entry1_id) : EMPTY_SLOT);
        setEntry2Id(match.entry2_id ? String(match.entry2_id) : EMPTY_SLOT);
        setError(null);
        setEditing(true);
    };

    const cancel = () => {
        setEditing(false);
        setError(null);
    };

    const save = () => {
        setProcessing(true);
        setError(null);

        router.patch(
            updateBracketMatch(match).url,
            {
                entry1_id: entry1Id === EMPTY_SLOT ? null : Number(entry1Id),
                entry2_id: entry2Id === EMPTY_SLOT ? null : Number(entry2Id),
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => setEditing(false),
                onError: (errors) => setError(Object.values(errors)[0] as string),
                onFinish: () => setProcessing(false),
            },
        );
    };

    return {
        editing,
        start,
        cancel,
        save,
        entry1Id,
        setEntry1Id,
        entry2Id,
        setEntry2Id,
        processing,
        error,
    };
}

export function MatchupEntrySelect({
    label,
    value,
    onChange,
    registrations,
    className,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    registrations: OpenPlayRegistration[];
    className?: string;
}) {
    return (
        <div className="grid gap-1">
            {label && <Label className="text-muted-foreground text-xs">{label}</Label>}
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger className={className}>
                    <SelectValue placeholder="TBD" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={EMPTY_SLOT}>TBD / empty</SelectItem>
                    {registrations.map((registration) => (
                        <SelectItem key={registration.id} value={String(registration.id)}>
                            {entryLabel(registration)}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

export function BracketMatchCard({
    match,
    registrations,
}: {
    match: OpenPlayMatch;
    registrations: OpenPlayRegistration[];
}) {
    const [score1, setScore1] = useState(match.entry1_score?.toString() ?? '');
    const [score2, setScore2] = useState(match.entry2_score?.toString() ?? '');
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const editor = useMatchupEditor(match);

    const completed = match.status === 'completed';
    // A completed match with an empty slot is a bye or walkover — the entry
    // it's paired against never existed (winners-bracket bye) or never
    // produced a loser to send here (losers-bracket sibling was itself a
    // bye), so the filled entry advances automatically.
    const isBye = (match.entry1_id === null || match.entry2_id === null) && completed;
    const canScore = match.entry1_id !== null && match.entry2_id !== null && !completed;
    const entry1Won = completed && match.winner_registration_id === match.entry1_id;
    const entry2Won = completed && match.winner_registration_id === match.entry2_id;

    const save = () => {
        if (score1 === '' || score2 === '') {
            return;
        }

        setProcessing(true);
        setError(null);

        router.patch(
            updateScore(match).url,
            {
                entry1_score: Number(score1),
                entry2_score: Number(score2),
            },
            {
                preserveScroll: true,
                preserveState: true,
                onError: (errors) => setError(Object.values(errors)[0] as string),
                onFinish: () => setProcessing(false),
            },
        );
    };

    if (editor.editing) {
        return (
            <div className="w-64 shrink-0 space-y-2 rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-sm">
                <MatchupEntrySelect
                    label="Entry 1"
                    value={editor.entry1Id}
                    onChange={editor.setEntry1Id}
                    registrations={registrations}
                    className="w-full"
                />
                <MatchupEntrySelect
                    label="Entry 2"
                    value={editor.entry2Id}
                    onChange={editor.setEntry2Id}
                    registrations={registrations}
                    className="w-full"
                />
                {editor.error && <p className="text-destructive text-xs">{editor.error}</p>}
                <div className="flex gap-1">
                    <Button
                        size="sm"
                        className="flex-1"
                        onClick={editor.save}
                        disabled={editor.processing}
                    >
                        <Check className="size-4" />
                        Save
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={editor.cancel}
                        disabled={editor.processing}
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="group relative w-64 shrink-0 rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-sm">
            {!completed && (
                <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full border border-slate-200 bg-white opacity-0 shadow-sm group-hover:opacity-100"
                    onClick={editor.start}
                    aria-label="Edit matchup"
                >
                    <Pencil className="size-3" />
                </Button>
            )}
            <div
                className={cn(
                    'flex items-center justify-between gap-2 py-1',
                    entry1Won && 'font-semibold text-emerald-700',
                )}
            >
                <span className="min-w-0 truncate">{bracketSlotLabel(match, 'entry1')}</span>
                {canScore ? (
                    <div className="flex items-center gap-1">
                        <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="h-7 w-7 shrink-0"
                            onClick={() =>
                                setScore1(String(Math.max(0, Number(score1 || 0) - 1)))
                            }
                        >
                            <Minus className="size-3" />
                        </Button>
                        <Input
                            type="number"
                            min={0}
                            className="h-7 w-10 px-1 text-center"
                            value={score1}
                            onChange={(e) => setScore1(e.target.value)}
                        />
                        <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="h-7 w-7 shrink-0"
                            onClick={() => setScore1(String(Number(score1 || 0) + 1))}
                        >
                            <Plus className="size-3" />
                        </Button>
                    </div>
                ) : (
                    match.entry1_score !== null && <span className="font-mono">{match.entry1_score}</span>
                )}
            </div>
            <div
                className={cn(
                    'flex items-center justify-between gap-2 border-t border-slate-100 py-1',
                    entry2Won && 'font-semibold text-emerald-700',
                )}
            >
                <span className="min-w-0 truncate">{bracketSlotLabel(match, 'entry2')}</span>
                {canScore ? (
                    <div className="flex items-center gap-1">
                        <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="h-7 w-7 shrink-0"
                            onClick={() =>
                                setScore2(String(Math.max(0, Number(score2 || 0) - 1)))
                            }
                        >
                            <Minus className="size-3" />
                        </Button>
                        <Input
                            type="number"
                            min={0}
                            className="h-7 w-10 px-1 text-center"
                            value={score2}
                            onChange={(e) => setScore2(e.target.value)}
                        />
                        <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="h-7 w-7 shrink-0"
                            onClick={() => setScore2(String(Number(score2 || 0) + 1))}
                        >
                            <Plus className="size-3" />
                        </Button>
                    </div>
                ) : (
                    match.entry2_score !== null && <span className="font-mono">{match.entry2_score}</span>
                )}
            </div>
            {canScore && (
                <Button
                    size="sm"
                    className="mt-2 w-full"
                    onClick={save}
                    disabled={processing || score1 === '' || score2 === ''}
                >
                    Save score
                </Button>
            )}
            {isBye && (
                <p className="text-muted-foreground mt-1 text-xs">
                    {match.bracket_side === 'losers'
                        ? 'Walkover — no opponent dropped into this slot'
                        : 'Bye — advances automatically'}
                </p>
            )}
            {error && <p className="text-destructive mt-1 text-xs">{error}</p>}
        </div>
    );
}

// Every round column is given the same total height, and each match's slot
// height doubles round over round (1x, 2x, 4x, ...). Since a match is always
// vertically centered within its own slot, the shared boundary between two
// sibling slots lands exactly on the next round's slot center — which is
// what lets the connector lines below meet up without any JS measuring.
const BRACKET_SLOT_HEIGHT = 120;

function BracketConnector({ isTop }: { isTop: boolean }) {
    return (
        <>
            {/* Horizontal stub out of the card, then vertical down/up to the
                pair's shared boundary (the next round's slot center). */}
            <span
                className={cn(
                    'absolute left-full w-3 border-slate-400',
                    isTop ? 'top-1/2 h-1/2 border-t-2 border-r-2' : 'top-0 h-1/2 border-r-2 border-b-2',
                )}
            />
            {/* Continues from that shared boundary into the next round's
                match, drawn once (from the top sibling) since both siblings'
                vertical segments end at the same point. */}
            {isTop && (
                <span className="absolute top-full left-[calc(100%+0.75rem)] h-0.5 w-3 -translate-y-1/2 bg-slate-400" />
            )}
        </>
    );
}

// Used for a losers-bracket "direct" round transition, where every match
// forwards 1:1 into the same-position match in the next round (no pairing/
// merging) — both columns share the same slot height, so a single straight
// line across the gap is enough.
function DirectBracketConnector() {
    return <span className="absolute left-full top-1/2 h-0.5 w-6 -translate-y-1/2 bg-slate-400" />;
}

export function BracketTree({
    matches,
    totalRounds,
    registrations,
    labelForRound = roundLabel,
}: {
    matches: OpenPlayMatch[];
    totalRounds: number;
    registrations: OpenPlayRegistration[];
    labelForRound?: (round: number, totalRounds: number) => string;
}) {
    const rounds = groupByRound(matches);
    const roundNumbers = [...rounds.keys()].sort((a, b) => a - b);

    return (
        <div className="overflow-x-auto pb-2">
            <div className="flex w-full justify-center gap-6">
                {roundNumbers.map((round, roundIndex) => (
                    <div key={round} className="flex w-64 shrink-0 flex-col">
                        <h5 className="text-muted-foreground mb-3 text-center text-xs font-semibold uppercase">
                            {labelForRound(round, totalRounds)}
                        </h5>
                        <div className="flex flex-col">
                            {rounds.get(round)!.map((match) => (
                                <div
                                    key={match.id}
                                    className="relative flex items-center justify-center"
                                    style={{ height: BRACKET_SLOT_HEIGHT * 2 ** roundIndex }}
                                >
                                    <BracketMatchCard match={match} registrations={registrations} />
                                    {round < totalRounds && (
                                        <BracketConnector
                                            isTop={(match.bracket_position ?? 0) % 2 === 0}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// The losers bracket alternates "direct" rounds (each match forwards 1:1
// into the next round, same match count) and "merge" rounds (two adjacent
// matches pair into one, halving the count) — so unlike the winners bracket,
// slot height only doubles on a merge transition, and a direct transition
// gets a plain straight connector instead of the top/bottom merge shape.
export function LosersBracketTree({
    matches,
    registrations,
    labelForRound,
}: {
    matches: OpenPlayMatch[];
    registrations: OpenPlayRegistration[];
    labelForRound: (round: number) => string;
}) {
    const rounds = groupByRound(matches);
    const roundNumbers = [...rounds.keys()].sort((a, b) => a - b);
    const heights = losersBracketRoundHeights(matches);

    return (
        <div className="overflow-x-auto pb-2">
            <div className="flex w-full justify-center gap-6">
                {roundNumbers.map((round, roundIndex) => {
                    const nextRound = roundNumbers[roundIndex + 1];
                    const hasNext = nextRound !== undefined;
                    const isMergeTransition =
                        hasNext && rounds.get(nextRound)!.length < rounds.get(round)!.length;

                    return (
                        <div key={round} className="flex w-64 shrink-0 flex-col">
                            <h5 className="text-muted-foreground mb-3 text-center text-xs font-semibold uppercase">
                                {labelForRound(round)}
                            </h5>
                            <div className="flex flex-col">
                                {rounds.get(round)!.map((match) => (
                                    <div
                                        key={match.id}
                                        className="relative flex items-center justify-center"
                                        style={{ height: BRACKET_SLOT_HEIGHT * heights.get(round)! }}
                                    >
                                        <BracketMatchCard match={match} registrations={registrations} />
                                        {hasNext &&
                                            (isMergeTransition ? (
                                                <BracketConnector
                                                    isTop={(match.bracket_position ?? 0) % 2 === 0}
                                                />
                                            ) : (
                                                <DirectBracketConnector />
                                            ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export function DoubleEliminationBracket({
    matches,
    registrations,
}: {
    matches: OpenPlayMatch[];
    registrations: OpenPlayRegistration[];
}) {
    const { winners, losers, final } = matchesByBracketSide(matches);
    const totalWbRounds = winners.length > 0 ? Math.max(...winners.map((m) => m.round)) : 0;
    const totalLbRounds = losers.length > 0 ? Math.max(...losers.map((m) => m.round)) : 0;
    const lastFinalMatch = final[final.length - 1];
    const champion =
        lastFinalMatch?.status === 'completed' ? (lastFinalMatch.winner ?? null) : null;

    return (
        <div className="space-y-8">
            <div>
                <h4 className="mb-3 text-sm font-semibold">Winners bracket</h4>
                <BracketTree matches={winners} totalRounds={totalWbRounds} registrations={registrations} />
            </div>

            {losers.length > 0 && (
                <div>
                    <h4 className="mb-3 text-sm font-semibold">Losers bracket</h4>
                    <LosersBracketTree
                        matches={losers}
                        registrations={registrations}
                        labelForRound={(round) => losersRoundLabel(round, totalLbRounds)}
                    />
                </div>
            )}

            {final.length > 0 && (
                <div>
                    <h4 className="mb-3 text-sm font-semibold">Finals</h4>
                    <div className="flex w-full justify-center gap-6">
                        {final.map((match) => (
                            <div key={match.id} className="flex w-64 shrink-0 flex-col gap-3">
                                <h5 className="text-muted-foreground text-center text-xs font-semibold uppercase">
                                    {finalMatchLabel(match.round)}
                                </h5>
                                <BracketMatchCard match={match} registrations={registrations} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {champion && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
                    <Trophy className="size-5" />
                    <span className="font-semibold">Champion: {entryLabel(champion)}</span>
                </div>
            )}
        </div>
    );
}
