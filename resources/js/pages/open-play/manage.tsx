import { Head, Link, router } from '@inertiajs/react';
import { CircleDollarSign, Maximize2, Trophy, UserPlus, X } from 'lucide-react';
import type { FormEvent} from 'react';
import { useState } from 'react';

import { ConfirmDialog } from '@/components/confirm-dialog';
import { OpenPlayJoinQrCard } from '@/components/open-play-join-qr-card';
import { PageHeader } from '@/components/page-header';
import { PlayerSearchInput } from '@/components/player-search-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { formatCurrency, formatDate, formatTime } from '@/lib/format';
import {
    bracketSlotLabel,
    computeStandings,
    entryLabel,
    finalMatchLabel,
    groupByRound,
    losersBracketRoundHeights,
    losersRoundLabel,
    matchesByBracketSide,
    roundLabel,
} from '@/lib/open-play';
import { cn } from '@/lib/utils';
import { edit, index as openPlayIndex } from '@/routes/open-play';
import { generate as generateBracket, reset as resetBracket } from '@/routes/open-play/bracket';
import { store as storeBracketMatch } from '@/routes/open-play/bracket/matches';
import { destroy as destroyBracketMatch } from '@/routes/open-play/bracket-matches';
import { updateScore } from '@/routes/open-play/matches';
import {
    addAll as addAllMembers,
    destroy as destroyRegistration,
    pairRandom as pairRandomly,
    store as storeRegistration,
    updatePayment as updateRegistrationPayment,
} from '@/routes/open-play/registrations';
import { update as updateTargetScore } from '@/routes/open-play/target-score';
import type { OpenPlaySession, OpenPlayMatch, OpenPlayRegistration, Player } from '@/types/booking';

type Props = {
    session: OpenPlaySession;
};

function MatchRow({
    match,
    onRemove,
}: {
    match: OpenPlayMatch;
    onRemove?: (match: OpenPlayMatch) => void;
}) {
    const [score1, setScore1] = useState(match.entry1_score?.toString() ?? '');
    const [score2, setScore2] = useState(match.entry2_score?.toString() ?? '');
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const completed = match.status === 'completed';
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

    return (
        <TableRow>
            <TableCell className={cn(entry1Won && 'font-semibold text-emerald-700')}>
                {entryLabel(match.entry1)}
                {entry1Won && (
                    <Badge variant="secondary" className="ml-2 bg-emerald-100 text-emerald-800">
                        Won
                    </Badge>
                )}
            </TableCell>
            <TableCell className={cn(entry2Won && 'font-semibold text-emerald-700')}>
                {entryLabel(match.entry2)}
                {entry2Won && (
                    <Badge variant="secondary" className="ml-2 bg-emerald-100 text-emerald-800">
                        Won
                    </Badge>
                )}
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-1">
                    <Input
                        type="number"
                        min={0}
                        className="w-16"
                        value={score1}
                        onChange={(e) => setScore1(e.target.value)}
                    />
                    <span className="text-muted-foreground">–</span>
                    <Input
                        type="number"
                        min={0}
                        className="w-16"
                        value={score2}
                        onChange={(e) => setScore2(e.target.value)}
                    />
                </div>
                {error && <p className="text-destructive mt-1 text-xs">{error}</p>}
            </TableCell>
            <TableCell>
                <Badge variant={completed ? 'default' : 'secondary'}>
                    {completed ? 'Completed' : 'Scheduled'}
                </Badge>
            </TableCell>
            <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                    <Button
                        size="sm"
                        onClick={save}
                        disabled={processing || score1 === '' || score2 === ''}
                    >
                        Save score
                    </Button>
                    {onRemove && (
                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => onRemove(match)}
                        >
                            <X className="size-4" />
                        </Button>
                    )}
                </div>
            </TableCell>
        </TableRow>
    );
}

function ManualMatchupForm({
    session,
    registrations,
}: {
    session: OpenPlaySession;
    registrations: OpenPlayRegistration[];
}) {
    const [entry1Id, setEntry1Id] = useState('');
    const [entry2Id, setEntry2Id] = useState('');
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submit = (event: FormEvent) => {
        event.preventDefault();

        if (!entry1Id || !entry2Id) {
            return;
        }

        setProcessing(true);
        setError(null);

        router.post(
            storeBracketMatch(session).url,
            { entry1_id: Number(entry1Id), entry2_id: Number(entry2Id) },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setEntry1Id('');
                    setEntry2Id('');
                },
                onError: (errors) => setError(Object.values(errors)[0] as string),
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <form
            onSubmit={submit}
            className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 p-4"
        >
            <div className="grid gap-1">
                <Label>Entry 1</Label>
                <Select value={entry1Id} onValueChange={setEntry1Id}>
                    <SelectTrigger className="w-56">
                        <SelectValue placeholder="Choose entry" />
                    </SelectTrigger>
                    <SelectContent>
                        {registrations.map((registration) => (
                            <SelectItem key={registration.id} value={String(registration.id)}>
                                {entryLabel(registration)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <span className="text-muted-foreground pb-2 text-sm">vs</span>
            <div className="grid gap-1">
                <Label>Entry 2</Label>
                <Select value={entry2Id} onValueChange={setEntry2Id}>
                    <SelectTrigger className="w-56">
                        <SelectValue placeholder="Choose entry" />
                    </SelectTrigger>
                    <SelectContent>
                        {registrations.map((registration) => (
                            <SelectItem key={registration.id} value={String(registration.id)}>
                                {entryLabel(registration)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <Button type="submit" disabled={!entry1Id || !entry2Id || processing}>
                Add matchup
            </Button>
            {error && <p className="text-destructive w-full text-sm">{error}</p>}
        </form>
    );
}

function BracketMatchCard({ match }: { match: OpenPlayMatch }) {
    const [score1, setScore1] = useState(match.entry1_score?.toString() ?? '');
    const [score2, setScore2] = useState(match.entry2_score?.toString() ?? '');
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    return (
        <div className="w-56 shrink-0 rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-sm">
            <div
                className={cn(
                    'flex items-center justify-between gap-2 py-1',
                    entry1Won && 'font-semibold text-emerald-700',
                )}
            >
                <span className="truncate">{bracketSlotLabel(match, 'entry1')}</span>
                {canScore ? (
                    <Input
                        type="number"
                        min={0}
                        className="h-7 w-12 px-1 text-center"
                        value={score1}
                        onChange={(e) => setScore1(e.target.value)}
                    />
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
                <span className="truncate">{bracketSlotLabel(match, 'entry2')}</span>
                {canScore ? (
                    <Input
                        type="number"
                        min={0}
                        className="h-7 w-12 px-1 text-center"
                        value={score2}
                        onChange={(e) => setScore2(e.target.value)}
                    />
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

function BracketTree({
    matches,
    totalRounds,
    labelForRound = roundLabel,
}: {
    matches: OpenPlayMatch[];
    totalRounds: number;
    labelForRound?: (round: number, totalRounds: number) => string;
}) {
    const rounds = groupByRound(matches);
    const roundNumbers = [...rounds.keys()].sort((a, b) => a - b);

    return (
        <div className="overflow-x-auto pb-2">
            <div className="flex gap-6">
                {roundNumbers.map((round, roundIndex) => (
                    <div key={round} className="flex w-56 shrink-0 flex-col">
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
                                    <BracketMatchCard match={match} />
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
function LosersBracketTree({
    matches,
    labelForRound,
}: {
    matches: OpenPlayMatch[];
    labelForRound: (round: number) => string;
}) {
    const rounds = groupByRound(matches);
    const roundNumbers = [...rounds.keys()].sort((a, b) => a - b);
    const heights = losersBracketRoundHeights(matches);

    return (
        <div className="overflow-x-auto pb-2">
            <div className="flex gap-6">
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
                                        <BracketMatchCard match={match} />
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

function DoubleEliminationBracket({ matches }: { matches: OpenPlayMatch[] }) {
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
                <BracketTree matches={winners} totalRounds={totalWbRounds} />
            </div>

            {losers.length > 0 && (
                <div>
                    <h4 className="mb-3 text-sm font-semibold">Losers bracket</h4>
                    <LosersBracketTree
                        matches={losers}
                        labelForRound={(round) => losersRoundLabel(round, totalLbRounds)}
                    />
                </div>
            )}

            {final.length > 0 && (
                <div>
                    <h4 className="mb-3 text-sm font-semibold">Finals</h4>
                    <div className="flex gap-6">
                        {final.map((match) => (
                            <div key={match.id} className="flex w-56 shrink-0 flex-col gap-3">
                                <h5 className="text-muted-foreground text-center text-xs font-semibold uppercase">
                                    {finalMatchLabel(match.round)}
                                </h5>
                                <BracketMatchCard match={match} />
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

export default function OpenPlayManage({ session }: Props) {
    const registrations = session.registrations ?? [];
    const paidCount = registrations.filter((r) => r.payment_status === 'paid').length;
    const matches = session.matches ?? [];
    const standings = computeStandings(registrations, matches);
    const totalRounds = matches.length > 0 ? Math.max(...matches.map((m) => m.round)) : 0;
    const finalMatch = matches.find((m) => m.round === totalRounds);
    const champion =
        session.bracket_format === 'single_elimination' && finalMatch?.status === 'completed'
            ? (finalMatch.winner ?? null)
            : null;

    const isDoublesSession = session.team_size === 'doubles';

    const [primaryPlayer, setPrimaryPlayer] = useState<Player | null>(null);
    const [partnerPlayer, setPartnerPlayer] = useState<Player | null>(null);
    const [partnerMode, setPartnerMode] = useState<'select' | 'random'>('select');
    const [registerProcessing, setRegisterProcessing] = useState(false);
    const [registerErrors, setRegisterErrors] = useState<Record<string, string>>({});

    const [targetScore, setTargetScore] = useState(String(session.target_score));
    const [targetProcessing, setTargetProcessing] = useState(false);

    const [resetOpen, setResetOpen] = useState(false);
    const [bracketProcessing, setBracketProcessing] = useState(false);
    const [fullscreenOpen, setFullscreenOpen] = useState(false);
    const [pairingProcessing, setPairingProcessing] = useState(false);
    const [addAllProcessing, setAddAllProcessing] = useState(false);

    const needsPartnerSelection = isDoublesSession && partnerMode === 'select';
    const unpairedCount = registrations.filter((r) => !r.partner_player_id).length;

    const submitRegistration = (event: FormEvent) => {
        event.preventDefault();

        if (!primaryPlayer || (needsPartnerSelection && !partnerPlayer)) {
            return;
        }

        setRegisterProcessing(true);

        router.post(
            storeRegistration(session).url,
            {
                player_id: primaryPlayer.id,
                partner_player_id: needsPartnerSelection ? (partnerPlayer?.id ?? null) : null,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setPrimaryPlayer(null);
                    setPartnerPlayer(null);
                    setRegisterErrors({});
                },
                onError: (errors) => setRegisterErrors(errors as Record<string, string>),
                onFinish: () => setRegisterProcessing(false),
            },
        );
    };

    const runAddAllMembers = () => {
        setAddAllProcessing(true);
        router.post(
            addAllMembers(session).url,
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => setAddAllProcessing(false),
            },
        );
    };

    const runPairRandomly = () => {
        setPairingProcessing(true);
        router.post(
            pairRandomly(session).url,
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => setPairingProcessing(false),
            },
        );
    };

    const removeRegistration = (registration: OpenPlayRegistration) => {
        router.delete(destroyRegistration(registration).url, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const toggleRegistrationPaid = (registration: OpenPlayRegistration) => {
        router.patch(
            updateRegistrationPayment(registration).url,
            {
                payment_status: registration.payment_status === 'paid' ? 'unpaid' : 'paid',
            },
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
    };

    const removeMatch = (match: OpenPlayMatch) => {
        router.delete(destroyBracketMatch(match).url, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const saveTargetScore = (event: FormEvent) => {
        event.preventDefault();
        setTargetProcessing(true);

        router.patch(
            updateTargetScore(session).url,
            { target_score: Number(targetScore) },
            {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => setTargetProcessing(false),
            },
        );
    };

    const runGenerateBracket = () => {
        setBracketProcessing(true);
        router.post(
            generateBracket(session).url,
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => setBracketProcessing(false),
            },
        );
    };

    const runResetBracket = () => {
        setBracketProcessing(true);
        router.delete(resetBracket(session).url, {
            preserveScroll: true,
            preserveState: true,
            onFinish: () => {
                setBracketProcessing(false);
                setResetOpen(false);
            },
        });
    };

    return (
        <>
            <Head title={`Manage ${session.title}`} />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <PageHeader
                    title={session.title}
                    description={`${formatDate(session.starts_at)} · ${formatTime(session.starts_at)}${session.ends_at ? ` – ${formatTime(session.ends_at)}` : ''}`}
                />

                <div className="mx-auto grid w-full max-w-5xl gap-6">
                    <OpenPlayJoinQrCard session={session} />

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <UserPlus className="size-5" />
                                Registered players
                            </CardTitle>
                            <CardDescription>
                                {registrations.length} {registrations.length === 1 ? 'entry' : 'entries'}{' '}
                                registered ·{' '}
                                {isDoublesSession
                                    ? '2v2 doubles — register each team as a pair.'
                                    : '1v1 singles.'}
                                {!!session.price_per_player && (
                                    <>
                                        {' '}
                                        · {formatCurrency(session.price_per_player)} entry fee ·{' '}
                                        {paidCount} of {registrations.length} paid
                                    </>
                                )}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <form
                                onSubmit={submitRegistration}
                                className="grid gap-3 rounded-lg border border-slate-200 p-4"
                            >
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <PlayerSearchInput
                                        label="Player"
                                        selected={primaryPlayer}
                                        onSelect={setPrimaryPlayer}
                                        onClear={() => setPrimaryPlayer(null)}
                                        excludeIds={partnerPlayer ? [partnerPlayer.id] : []}
                                    />
                                    {needsPartnerSelection && (
                                        <PlayerSearchInput
                                            label="Partner"
                                            selected={partnerPlayer}
                                            onSelect={setPartnerPlayer}
                                            onClear={() => setPartnerPlayer(null)}
                                            excludeIds={primaryPlayer ? [primaryPlayer.id] : []}
                                        />
                                    )}
                                </div>
                                {isDoublesSession && (
                                    <div className="grid gap-1">
                                        <Label className="text-muted-foreground text-xs">Partner</Label>
                                        <ToggleGroup
                                            type="single"
                                            variant="outline"
                                            value={partnerMode}
                                            onValueChange={(value) => {
                                                if (!value) {
                                                    return;
                                                }

                                                setPartnerMode(value as 'select' | 'random');
                                                setPartnerPlayer(null);
                                            }}
                                        >
                                            <ToggleGroupItem value="select">Pick a partner</ToggleGroupItem>
                                            <ToggleGroupItem value="random">
                                                Random (pair later)
                                            </ToggleGroupItem>
                                        </ToggleGroup>
                                    </div>
                                )}
                                {(registerErrors.player_id || registerErrors.partner_player_id) && (
                                    <p className="text-destructive text-sm">
                                        {registerErrors.player_id ?? registerErrors.partner_player_id}
                                    </p>
                                )}
                                <div className="flex justify-end">
                                    <Button
                                        type="submit"
                                        disabled={
                                            !primaryPlayer ||
                                            (needsPartnerSelection && !partnerPlayer) ||
                                            registerProcessing
                                        }
                                    >
                                        Register
                                    </Button>
                                </div>
                            </form>

                            <div className="flex items-center justify-between rounded-lg border border-dashed border-slate-300 p-3 text-sm">
                                <span className="text-muted-foreground">
                                    Register every active member in one click.
                                </span>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={runAddAllMembers}
                                    disabled={addAllProcessing}
                                >
                                    Add all members
                                </Button>
                            </div>

                            {isDoublesSession && unpairedCount > 0 && (
                                <div className="flex items-center justify-between rounded-lg border border-dashed border-slate-300 p-3 text-sm">
                                    <span className="text-muted-foreground">
                                        {unpairedCount} {unpairedCount === 1 ? 'player is' : 'players are'}{' '}
                                        waiting for a partner.
                                    </span>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={runPairRandomly}
                                        disabled={unpairedCount < 2 || pairingProcessing}
                                    >
                                        Randomly pair remaining players
                                    </Button>
                                </div>
                            )}

                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Entry</TableHead>
                                        {!!session.price_per_player && <TableHead>Payment</TableHead>}
                                        <TableHead>Added by</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {registrations.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={session.price_per_player ? 4 : 3}
                                                className="text-muted-foreground text-center"
                                            >
                                                No players registered yet.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        registrations.map((registration) => (
                                            <TableRow key={registration.id}>
                                                <TableCell>
                                                    {entryLabel(registration)}
                                                    {isDoublesSession && !registration.partner_player_id && (
                                                        <Badge
                                                            variant="secondary"
                                                            className="ml-2 bg-amber-100 text-amber-800"
                                                        >
                                                            Awaiting partner
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                {!!session.price_per_player && (
                                                    <TableCell>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant={
                                                                registration.payment_status === 'paid'
                                                                    ? 'secondary'
                                                                    : 'outline'
                                                            }
                                                            className={cn(
                                                                'h-7 px-2 text-xs',
                                                                registration.payment_status === 'paid' &&
                                                                    'border-emerald-200 bg-emerald-100 text-emerald-800 hover:bg-emerald-200',
                                                            )}
                                                            onClick={() => toggleRegistrationPaid(registration)}
                                                        >
                                                            <CircleDollarSign className="size-3.5" />
                                                            {registration.payment_status === 'paid'
                                                                ? 'Paid'
                                                                : 'Mark paid'}
                                                        </Button>
                                                    </TableCell>
                                                )}
                                                <TableCell>{registration.creator?.name ?? '—'}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeRegistration(registration)}
                                                    >
                                                        <X className="size-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Trophy className="size-5" />
                                {session.bracket_generation === 'manual'
                                    ? 'Manual matchups'
                                    : session.bracket_format === 'single_elimination'
                                      ? 'Single elimination bracket'
                                      : session.bracket_format === 'double_elimination'
                                        ? 'Double elimination bracket'
                                        : session.bracket_format === 'round_robin'
                                          ? 'Round robin bracket'
                                          : 'Bracket'}
                            </CardTitle>
                            <CardDescription>
                                {session.bracket_generation === 'manual'
                                    ? "Build the pairing list yourself below, then enter each match's final score."
                                    : session.bracket_format === 'single_elimination'
                                      ? `Knockout format (${session.bracket_generation === 'random' ? 'random draw' : 'seeded by registration order'}) — lose once and you are out. Enter each match score to advance the winner.`
                                      : session.bracket_format === 'double_elimination'
                                        ? `Knockout format (${session.bracket_generation === 'random' ? 'random draw' : 'seeded by registration order'}) — a loss drops an entry to the losers bracket; lose twice and you are out. Enter each match score to advance the winner.`
                                        : `Every entry plays every other entry once (${session.bracket_generation === 'random' ? 'random draw' : 'seeded by registration order'}). Enter each match's final score to record the winner.`}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <form
                                onSubmit={saveTargetScore}
                                className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 p-4"
                            >
                                <div className="grid gap-1">
                                    <Label htmlFor="target-score">Target score (points to win a game)</Label>
                                    <Input
                                        id="target-score"
                                        type="number"
                                        min={1}
                                        max={99}
                                        className="w-28"
                                        value={targetScore}
                                        onChange={(e) => setTargetScore(e.target.value)}
                                    />
                                </div>
                                <Button type="submit" variant="outline" disabled={targetProcessing}>
                                    Save target score
                                </Button>
                            </form>

                            {session.bracket_generation === 'manual' ? (
                                <>
                                    <ManualMatchupForm session={session} registrations={registrations} />

                                    {matches.length === 0 ? (
                                        <p className="text-muted-foreground text-sm">
                                            No matchups added yet.
                                        </p>
                                    ) : (
                                        <>
                                            <div className="flex justify-end">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => setResetOpen(true)}
                                                >
                                                    Reset all matchups
                                                </Button>
                                            </div>

                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Entry 1</TableHead>
                                                        <TableHead>Entry 2</TableHead>
                                                        <TableHead>Score</TableHead>
                                                        <TableHead>Status</TableHead>
                                                        <TableHead className="text-right">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {matches.map((match) => (
                                                        <MatchRow
                                                            key={match.id}
                                                            match={match}
                                                            onRemove={removeMatch}
                                                        />
                                                    ))}
                                                </TableBody>
                                            </Table>

                                            <div>
                                                <h4 className="mb-2 text-sm font-semibold">Standings</h4>
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Entry</TableHead>
                                                            <TableHead>Played</TableHead>
                                                            <TableHead>Wins</TableHead>
                                                            <TableHead>Losses</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {standings.map((standing) => (
                                                            <TableRow key={standing.registrationId}>
                                                                <TableCell>{standing.label}</TableCell>
                                                                <TableCell>{standing.played}</TableCell>
                                                                <TableCell>{standing.wins}</TableCell>
                                                                <TableCell>{standing.losses}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </>
                                    )}
                                </>
                            ) : matches.length === 0 ? (
                                <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed border-slate-300 p-4">
                                    {session.bracket_format ? (
                                        <>
                                            <p className="text-muted-foreground text-sm">
                                                No bracket yet. Generate a{' '}
                                                {session.bracket_format === 'single_elimination'
                                                    ? 'single elimination'
                                                    : session.bracket_format === 'double_elimination'
                                                      ? 'double elimination'
                                                      : 'round robin'}{' '}
                                                bracket from the {registrations.length} registered{' '}
                                                {registrations.length === 1 ? 'entry' : 'entries'}.
                                            </p>
                                            <Button
                                                type="button"
                                                onClick={runGenerateBracket}
                                                disabled={registrations.length < 2 || bracketProcessing}
                                            >
                                                Generate bracket
                                            </Button>
                                        </>
                                    ) : (
                                        <p className="text-muted-foreground text-sm">
                                            This session doesn&apos;t have a bracket format set yet.{' '}
                                            <Link href={edit(session)} className="underline">
                                                Edit the session
                                            </Link>{' '}
                                            to choose one.
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-end gap-2">
                                        {(session.bracket_format === 'single_elimination' ||
                                            session.bracket_format === 'double_elimination') && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setFullscreenOpen(true)}
                                            >
                                                <Maximize2 className="size-4" />
                                                View full bracket
                                            </Button>
                                        )}
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setResetOpen(true)}
                                        >
                                            Reset bracket
                                        </Button>
                                    </div>

                                    {session.bracket_format === 'single_elimination' ? (
                                        <>
                                            <BracketTree matches={matches} totalRounds={totalRounds} />
                                            {champion && (
                                                <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
                                                    <Trophy className="size-5" />
                                                    <span className="font-semibold">
                                                        Champion: {entryLabel(champion)}
                                                    </span>
                                                </div>
                                            )}
                                        </>
                                    ) : session.bracket_format === 'double_elimination' ? (
                                        <DoubleEliminationBracket matches={matches} />
                                    ) : (
                                        <>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Entry 1</TableHead>
                                                        <TableHead>Entry 2</TableHead>
                                                        <TableHead>Score</TableHead>
                                                        <TableHead>Status</TableHead>
                                                        <TableHead className="text-right">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {matches.map((match) => (
                                                        <MatchRow key={match.id} match={match} />
                                                    ))}
                                                </TableBody>
                                            </Table>

                                            <div>
                                                <h4 className="mb-2 text-sm font-semibold">Standings</h4>
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Entry</TableHead>
                                                            <TableHead>Played</TableHead>
                                                            <TableHead>Wins</TableHead>
                                                            <TableHead>Losses</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {standings.map((standing) => (
                                                            <TableRow key={standing.registrationId}>
                                                                <TableCell>{standing.label}</TableCell>
                                                                <TableCell>{standing.played}</TableCell>
                                                                <TableCell>{standing.wins}</TableCell>
                                                                <TableCell>{standing.losses}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <ConfirmDialog
                open={resetOpen}
                onOpenChange={setResetOpen}
                title="Reset bracket"
                description="All matches and recorded scores for this session will be deleted. Registered players stay intact."
                confirmLabel="Reset"
                variant="destructive"
                loading={bracketProcessing}
                onConfirm={runResetBracket}
            />

            <Dialog open={fullscreenOpen} onOpenChange={setFullscreenOpen}>
                <DialogContent className="flex h-[90vh] w-[95vw] max-w-none flex-col overflow-hidden sm:max-w-none">
                    <DialogHeader>
                        <DialogTitle>{session.title} — Bracket</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-auto pt-2">
                        {session.bracket_format === 'double_elimination' ? (
                            <DoubleEliminationBracket matches={matches} />
                        ) : (
                            <>
                                <BracketTree matches={matches} totalRounds={totalRounds} />
                                {champion && (
                                    <div className="mt-6 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
                                        <Trophy className="size-5" />
                                        <span className="font-semibold">
                                            Champion: {entryLabel(champion)}
                                        </span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

OpenPlayManage.layout = {
    breadcrumbs: [
        { title: 'Open play', href: openPlayIndex() },
        { title: 'Manage', href: openPlayIndex() },
    ],
};
