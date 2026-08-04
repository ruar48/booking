import { Head, Link, router } from '@inertiajs/react';
import { FormEvent, useEffect, useState } from 'react';
import { Trophy, UserPlus, X } from 'lucide-react';

import { ConfirmDialog } from '@/components/confirm-dialog';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import { formatDate, formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { index as openPlayIndex } from '@/routes/open-play';
import { generate as generateBracket, reset as resetBracket } from '@/routes/open-play/bracket';
import { updateScore } from '@/routes/open-play/matches';
import { search as searchPlayers } from '@/routes/open-play/players';
import { destroy as destroyRegistration, store as storeRegistration } from '@/routes/open-play/registrations';
import { update as updateTargetScore } from '@/routes/open-play/target-score';
import type { ClubEvent, ClubEventMatch, ClubEventRegistration, Player } from '@/types/booking';

type Props = {
    session: ClubEvent;
};

function entryLabel(entry?: ClubEventRegistration | null): string {
    if (!entry) {
        return '—';
    }

    const primary = entry.player?.user?.name ?? `Player #${entry.player_id}`;

    if (entry.partner) {
        return `${primary} & ${entry.partner.user?.name ?? `Player #${entry.partner_player_id}`}`;
    }

    return primary;
}

type Standing = {
    registrationId: number;
    label: string;
    wins: number;
    losses: number;
    played: number;
};

function computeStandings(
    registrations: ClubEventRegistration[],
    matches: ClubEventMatch[],
): Standing[] {
    const standings = new Map<number, Standing>();

    for (const registration of registrations) {
        standings.set(registration.id, {
            registrationId: registration.id,
            label: entryLabel(registration),
            wins: 0,
            losses: 0,
            played: 0,
        });
    }

    for (const match of matches) {
        if (match.status !== 'completed' || match.winner_registration_id == null) {
            continue;
        }

        const loserId =
            match.winner_registration_id === match.entry1_id ? match.entry2_id : match.entry1_id;

        const winner = standings.get(match.winner_registration_id);
        const loser = loserId !== null ? standings.get(loserId) : undefined;

        if (winner) {
            winner.wins += 1;
            winner.played += 1;
        }

        if (loser) {
            loser.losses += 1;
            loser.played += 1;
        }
    }

    return [...standings.values()].sort(
        (a, b) => b.wins - a.wins || b.played - a.played || a.label.localeCompare(b.label),
    );
}

function bracketSlotLabel(match: ClubEventMatch, slot: 'entry1' | 'entry2'): string {
    const entry = match[slot];

    if (entry) {
        return entryLabel(entry);
    }

    if (slot === 'entry2' && match.status === 'completed') {
        return 'Bye';
    }

    return 'TBD';
}

function groupByRound(matches: ClubEventMatch[]): Map<number, ClubEventMatch[]> {
    const rounds = new Map<number, ClubEventMatch[]>();

    for (const match of matches) {
        const list = rounds.get(match.round) ?? [];
        list.push(match);
        rounds.set(match.round, list);
    }

    for (const list of rounds.values()) {
        list.sort((a, b) => (a.bracket_position ?? 0) - (b.bracket_position ?? 0));
    }

    return rounds;
}

function roundLabel(round: number, totalRounds: number): string {
    if (round === totalRounds) {
        return 'Final';
    }

    if (round === totalRounds - 1) {
        return 'Semifinals';
    }

    if (round === totalRounds - 2) {
        return 'Quarterfinals';
    }

    return `Round ${round}`;
}

function PlayerSearchInput({
    label,
    selected,
    onSelect,
    onClear,
    placeholder,
}: {
    label: string;
    selected: Player | null;
    onSelect: (player: Player) => void;
    onClear: () => void;
    placeholder?: string;
}) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Player[]>([]);

    useEffect(() => {
        if (selected || query.trim().length < 2) {
            setResults([]);
            return;
        }

        const handle = window.setTimeout(() => {
            fetch(searchPlayers.url({ query: { q: query } }), {
                headers: { Accept: 'application/json' },
            })
                .then((r) => (r.ok ? r.json() : []))
                .then(setResults)
                .catch(() => setResults([]));
        }, 300);

        return () => window.clearTimeout(handle);
    }, [query, selected]);

    if (selected) {
        return (
            <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">{label}</Label>
                <Badge variant="secondary">{selected.user?.name ?? `Player #${selected.id}`}</Badge>
                <Button type="button" variant="ghost" size="sm" onClick={onClear}>
                    Change
                </Button>
            </div>
        );
    }

    return (
        <div className="relative grid gap-1">
            <Label className="text-xs text-muted-foreground">{label}</Label>
            <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder ?? 'Search player by name...'}
            />
            {results.length > 0 && (
                <div className="absolute top-full z-10 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-md">
                    {results.map((player) => (
                        <button
                            key={player.id}
                            type="button"
                            className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                            onClick={() => {
                                onSelect(player);
                                setQuery('');
                                setResults([]);
                            }}
                        >
                            {player.user?.name ?? `Player #${player.id}`}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function MatchRow({ match }: { match: ClubEventMatch }) {
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
                <Button
                    size="sm"
                    onClick={save}
                    disabled={processing || score1 === '' || score2 === ''}
                >
                    Save score
                </Button>
            </TableCell>
        </TableRow>
    );
}

function BracketMatchCard({ match }: { match: ClubEventMatch }) {
    const [score1, setScore1] = useState(match.entry1_score?.toString() ?? '');
    const [score2, setScore2] = useState(match.entry2_score?.toString() ?? '');
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const completed = match.status === 'completed';
    const isBye = match.entry2_id === null && completed;
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
            {isBye && <p className="text-muted-foreground mt-1 text-xs">Bye — advances automatically</p>}
            {error && <p className="text-destructive mt-1 text-xs">{error}</p>}
        </div>
    );
}

function BracketTree({ matches, totalRounds }: { matches: ClubEventMatch[]; totalRounds: number }) {
    const rounds = groupByRound(matches);
    const roundNumbers = [...rounds.keys()].sort((a, b) => a - b);

    return (
        <div className="flex gap-6 overflow-x-auto pb-2">
            {roundNumbers.map((round) => (
                <div key={round} className="flex min-w-[14rem] flex-col justify-around gap-4">
                    <h5 className="text-muted-foreground text-center text-xs font-semibold uppercase">
                        {roundLabel(round, totalRounds)}
                    </h5>
                    {rounds.get(round)!.map((match) => (
                        <BracketMatchCard key={match.id} match={match} />
                    ))}
                </div>
            ))}
        </div>
    );
}

export default function OpenPlayManage({ session }: Props) {
    const registrations = session.registrations ?? [];
    const matches = session.matches ?? [];
    const standings = computeStandings(registrations, matches);
    const totalRounds = matches.length > 0 ? Math.max(...matches.map((m) => m.round)) : 0;
    const finalMatch = matches.find((m) => m.round === totalRounds);
    const champion =
        session.bracket_format === 'single_elimination' && finalMatch?.status === 'completed'
            ? (finalMatch.winner ?? null)
            : null;

    const [primaryPlayer, setPrimaryPlayer] = useState<Player | null>(null);
    const [partnerPlayer, setPartnerPlayer] = useState<Player | null>(null);
    const [isDoubles, setIsDoubles] = useState(false);
    const [registerProcessing, setRegisterProcessing] = useState(false);
    const [registerErrors, setRegisterErrors] = useState<Record<string, string>>({});

    const [targetScore, setTargetScore] = useState(String(session.target_score));
    const [targetProcessing, setTargetProcessing] = useState(false);

    const [resetOpen, setResetOpen] = useState(false);
    const [bracketProcessing, setBracketProcessing] = useState(false);
    const [bracketFormatChoice, setBracketFormatChoice] = useState<
        'round_robin' | 'single_elimination'
    >('round_robin');

    const submitRegistration = (event: FormEvent) => {
        event.preventDefault();

        if (!primaryPlayer) {
            return;
        }

        setRegisterProcessing(true);

        router.post(
            storeRegistration(session).url,
            {
                player_id: primaryPlayer.id,
                partner_player_id: isDoubles ? (partnerPlayer?.id ?? null) : null,
            },
            {
                onSuccess: () => {
                    setPrimaryPlayer(null);
                    setPartnerPlayer(null);
                    setIsDoubles(false);
                    setRegisterErrors({});
                },
                onError: (errors) => setRegisterErrors(errors as Record<string, string>),
                onFinish: () => setRegisterProcessing(false),
            },
        );
    };

    const removeRegistration = (registration: ClubEventRegistration) => {
        router.delete(destroyRegistration(registration).url);
    };

    const saveTargetScore = (event: FormEvent) => {
        event.preventDefault();
        setTargetProcessing(true);

        router.patch(
            updateTargetScore(session).url,
            { target_score: Number(targetScore) },
            { onFinish: () => setTargetProcessing(false) },
        );
    };

    const runGenerateBracket = () => {
        setBracketProcessing(true);
        router.post(
            generateBracket(session).url,
            { format: bracketFormatChoice },
            { onFinish: () => setBracketProcessing(false) },
        );
    };

    const runResetBracket = () => {
        setBracketProcessing(true);
        router.delete(resetBracket(session).url, {
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
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <UserPlus className="size-5" />
                                Registered players
                            </CardTitle>
                            <CardDescription>
                                {registrations.length} {registrations.length === 1 ? 'entry' : 'entries'}{' '}
                                registered · pair players up for doubles.
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
                                    />
                                    {isDoubles && (
                                        <PlayerSearchInput
                                            label="Partner"
                                            selected={partnerPlayer}
                                            onSelect={setPartnerPlayer}
                                            onClear={() => setPartnerPlayer(null)}
                                        />
                                    )}
                                </div>
                                <label className="flex items-center gap-2 text-sm">
                                    <Checkbox
                                        checked={isDoubles}
                                        onCheckedChange={(checked) => {
                                            setIsDoubles(checked === true);
                                            if (checked !== true) {
                                                setPartnerPlayer(null);
                                            }
                                        }}
                                    />
                                    Doubles (pair with a partner)
                                </label>
                                {(registerErrors.player_id || registerErrors.partner_player_id) && (
                                    <p className="text-destructive text-sm">
                                        {registerErrors.player_id ?? registerErrors.partner_player_id}
                                    </p>
                                )}
                                <div className="flex justify-end">
                                    <Button type="submit" disabled={!primaryPlayer || registerProcessing}>
                                        Register
                                    </Button>
                                </div>
                            </form>

                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Entry</TableHead>
                                        <TableHead>Added by</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {registrations.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-muted-foreground text-center">
                                                No players registered yet.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        registrations.map((registration) => (
                                            <TableRow key={registration.id}>
                                                <TableCell>{entryLabel(registration)}</TableCell>
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
                                {session.bracket_format === 'single_elimination'
                                    ? 'Single elimination bracket'
                                    : session.bracket_format === 'round_robin'
                                      ? 'Round robin bracket'
                                      : 'Bracket'}
                            </CardTitle>
                            <CardDescription>
                                {session.bracket_format === 'single_elimination'
                                    ? 'Knockout format — lose once and you are out. Enter each match score to advance the winner.'
                                    : "Every entry plays every other entry once. Enter each match's final score to record the winner."}
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

                            {matches.length === 0 ? (
                                <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed border-slate-300 p-4">
                                    <p className="text-muted-foreground text-sm">
                                        No bracket yet. Choose a format and generate one from the{' '}
                                        {registrations.length} registered{' '}
                                        {registrations.length === 1 ? 'entry' : 'entries'}.
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Select
                                            value={bracketFormatChoice}
                                            onValueChange={(v) =>
                                                setBracketFormatChoice(
                                                    v as 'round_robin' | 'single_elimination',
                                                )
                                            }
                                        >
                                            <SelectTrigger className="w-56">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="round_robin">Round robin</SelectItem>
                                                <SelectItem value="single_elimination">
                                                    Single elimination
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button
                                            type="button"
                                            onClick={runGenerateBracket}
                                            disabled={registrations.length < 2 || bracketProcessing}
                                        >
                                            Generate bracket
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-end">
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
        </>
    );
}

OpenPlayManage.layout = {
    breadcrumbs: [
        { title: 'Open play', href: openPlayIndex() },
        { title: 'Manage', href: openPlayIndex() },
    ],
};
