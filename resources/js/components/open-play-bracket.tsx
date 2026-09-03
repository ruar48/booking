import {
    bracketSlotLabel,
    finalMatchLabel,
    groupByRound,
    isEntryInMatch,
    losersBracketRoundHeights,
    losersRoundLabel,
    matchesByBracketSide,
    roundLabel,
} from '@/lib/open-play';
import { cn } from '@/lib/utils';
import type { OpenPlayMatch } from '@/types/booking';

// Mirrors the layout math in open-play/manage.tsx's bracket tree: every round
// column shares one height, and each match's slot doubles round over round
// so a match's vertical center always lands on the shared boundary the next
// round's connector line needs.
const BRACKET_SLOT_HEIGHT = 120;

function BracketConnector({ isTop }: { isTop: boolean }) {
    return (
        <>
            <span
                className={cn(
                    'absolute left-full w-3 border-slate-400',
                    isTop ? 'top-1/2 h-1/2 border-t-2 border-r-2' : 'top-0 h-1/2 border-r-2 border-b-2',
                )}
            />
            {isTop && (
                <span className="absolute top-full left-[calc(100%+0.75rem)] h-0.5 w-3 -translate-y-1/2 bg-slate-400" />
            )}
        </>
    );
}

// See manage.tsx's DirectBracketConnector — used for a losers-bracket round
// that forwards 1:1 into the next round rather than merging pairs.
function DirectBracketConnector() {
    return <span className="absolute left-full top-1/2 h-0.5 w-6 -translate-y-1/2 bg-slate-400" />;
}

export function ReadOnlyMatchCard({
    match,
    registrationId,
}: {
    match: OpenPlayMatch;
    registrationId?: number;
}) {
    const completed = match.status === 'completed';
    // A completed match with an empty slot is a bye or walkover — see
    // manage.tsx's BracketMatchCard for why this can happen on either side.
    const isBye = (match.entry1_id === null || match.entry2_id === null) && completed;
    const entry1Won = completed && match.winner_registration_id === match.entry1_id;
    const entry2Won = completed && match.winner_registration_id === match.entry2_id;
    const isMine = registrationId !== undefined && isEntryInMatch(match, registrationId);

    return (
        <div
            className={cn(
                'w-56 shrink-0 rounded-lg border bg-white p-3 text-sm shadow-sm',
                isMine ? 'border-brand-lime ring-brand-lime/30 ring-2' : 'border-slate-200',
            )}
        >
            <div
                className={cn(
                    'flex items-center justify-between gap-2 py-1',
                    entry1Won && 'font-semibold text-emerald-700',
                )}
            >
                <span className="truncate">{bracketSlotLabel(match, 'entry1')}</span>
                {match.entry1_score !== null && <span className="font-mono">{match.entry1_score}</span>}
            </div>
            <div
                className={cn(
                    'flex items-center justify-between gap-2 border-t border-slate-100 py-1',
                    entry2Won && 'font-semibold text-emerald-700',
                )}
            >
                <span className="truncate">{bracketSlotLabel(match, 'entry2')}</span>
                {match.entry2_score !== null && <span className="font-mono">{match.entry2_score}</span>}
            </div>
            {isBye && (
                <p className="text-muted-foreground mt-1 text-xs">
                    {match.bracket_side === 'losers'
                        ? 'Walkover — no opponent dropped into this slot'
                        : 'Bye — advanced automatically'}
                </p>
            )}
            {!completed && match.entry1_id !== null && match.entry2_id !== null && (
                <p className="text-muted-foreground mt-1 text-xs">Not played yet</p>
            )}
        </div>
    );
}

export function ReadOnlyBracketTree({
    matches,
    totalRounds,
    registrationId,
}: {
    matches: OpenPlayMatch[];
    totalRounds: number;
    registrationId?: number;
}) {
    const rounds = groupByRound(matches);
    const roundNumbers = [...rounds.keys()].sort((a, b) => a - b);

    return (
        <div className="overflow-x-auto pb-2">
            <div className="flex w-full justify-start gap-6">
                {roundNumbers.map((round, roundIndex) => (
                    <div key={round} className="flex w-56 shrink-0 flex-col">
                        <h5 className="text-muted-foreground mb-3 text-center text-xs font-semibold uppercase">
                            {roundLabel(round, totalRounds)}
                        </h5>
                        <div className="flex flex-col">
                            {rounds.get(round)!.map((match) => (
                                <div
                                    key={match.id}
                                    className="relative flex items-center justify-center"
                                    style={{ height: BRACKET_SLOT_HEIGHT * 2 ** roundIndex }}
                                >
                                    <ReadOnlyMatchCard match={match} registrationId={registrationId} />
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

// See manage.tsx's LosersBracketTree for why this alternates between direct
// (1:1) and merge (pairing) round transitions instead of always doubling.
export function ReadOnlyLosersBracketTree({
    matches,
    labelForRound,
    registrationId,
}: {
    matches: OpenPlayMatch[];
    labelForRound: (round: number) => string;
    registrationId?: number;
}) {
    const rounds = groupByRound(matches);
    const roundNumbers = [...rounds.keys()].sort((a, b) => a - b);
    const heights = losersBracketRoundHeights(matches);

    return (
        <div className="overflow-x-auto pb-2">
            <div className="flex w-full justify-start gap-6">
                {roundNumbers.map((round, roundIndex) => {
                    const nextRound = roundNumbers[roundIndex + 1];
                    const hasNext = nextRound !== undefined;
                    const isMergeTransition =
                        hasNext && rounds.get(nextRound)!.length < rounds.get(round)!.length;

                    return (
                        <div key={round} className="flex w-56 shrink-0 flex-col">
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
                                        <ReadOnlyMatchCard
                                            match={match}
                                            registrationId={registrationId}
                                        />
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

export function ReadOnlyDoubleEliminationBracket({
    matches,
    registrationId,
}: {
    matches: OpenPlayMatch[];
    registrationId?: number;
}) {
    const { winners, losers, final } = matchesByBracketSide(matches);
    const totalWbRounds = winners.length > 0 ? Math.max(...winners.map((m) => m.round)) : 0;
    const totalLbRounds = losers.length > 0 ? Math.max(...losers.map((m) => m.round)) : 0;

    return (
        <div className="space-y-8">
            <div>
                <h4 className="mb-3 text-sm font-semibold">Winners bracket</h4>
                <ReadOnlyBracketTree
                    matches={winners}
                    totalRounds={totalWbRounds}
                    registrationId={registrationId}
                />
            </div>

            {losers.length > 0 && (
                <div>
                    <h4 className="mb-3 text-sm font-semibold">Losers bracket</h4>
                    <ReadOnlyLosersBracketTree
                        matches={losers}
                        labelForRound={(round) => losersRoundLabel(round, totalLbRounds)}
                        registrationId={registrationId}
                    />
                </div>
            )}

            {final.length > 0 && (
                <div>
                    <h4 className="mb-3 text-sm font-semibold">Finals</h4>
                    <div className="flex w-full justify-start gap-6 overflow-x-auto pb-2">
                        {final.map((match) => (
                            <div key={match.id} className="flex w-56 shrink-0 flex-col gap-3">
                                <h5 className="text-muted-foreground text-center text-xs font-semibold uppercase">
                                    {finalMatchLabel(match.round)}
                                </h5>
                                <ReadOnlyMatchCard match={match} registrationId={registrationId} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
