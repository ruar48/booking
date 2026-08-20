import { Head, Link, router } from '@inertiajs/react';
import {
    Check,
    CircleDollarSign,
    Eye,
    EyeOff,
    Maximize2,
    Pencil,
    Trophy,
    UserPlus,
    X,
} from 'lucide-react';
import type { FormEvent} from 'react';
import { useState } from 'react';

import { ConfirmDialog } from '@/components/confirm-dialog';
import {
    BracketTree,
    DoubleEliminationBracket,
    MatchupEntrySelect,
    useMatchupEditor,
} from '@/components/open-play-editable-bracket';
import { OpenPlayJoinQrCard } from '@/components/open-play-join-qr-card';
import { PageHeader } from '@/components/page-header';
import { PlayerSearchInput } from '@/components/player-search-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
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
    isEntryInMatch,
    matchRoundLabel,
} from '@/lib/open-play';
import { cn } from '@/lib/utils';
import { bracketFull, edit, index as openPlayIndex } from '@/routes/open-play';
import { generate as generateBracket, reset as resetBracket } from '@/routes/open-play/bracket';
import { store as storeBracketMatch } from '@/routes/open-play/bracket/matches';
import { update as updateBracketVisibility } from '@/routes/open-play/bracket/visibility';
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
    registrations,
    onRemove,
}: {
    match: OpenPlayMatch;
    registrations: OpenPlayRegistration[];
    onRemove?: (match: OpenPlayMatch) => void;
}) {
    const [score1, setScore1] = useState(match.entry1_score?.toString() ?? '');
    const [score2, setScore2] = useState(match.entry2_score?.toString() ?? '');
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const editor = useMatchupEditor(match);

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

    if (editor.editing) {
        return (
            <TableRow>
                <TableCell>
                    <MatchupEntrySelect
                        label=""
                        value={editor.entry1Id}
                        onChange={editor.setEntry1Id}
                        registrations={registrations}
                        className="w-full"
                    />
                </TableCell>
                <TableCell>
                    <MatchupEntrySelect
                        label=""
                        value={editor.entry2Id}
                        onChange={editor.setEntry2Id}
                        registrations={registrations}
                        className="w-full"
                    />
                </TableCell>
                <TableCell colSpan={2}>
                    {editor.error && <p className="text-destructive text-xs">{editor.error}</p>}
                </TableCell>
                <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                        <Button size="sm" onClick={editor.save} disabled={editor.processing}>
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
                </TableCell>
            </TableRow>
        );
    }

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
                    {!completed && (
                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={editor.start}
                            aria-label="Edit matchup"
                        >
                            <Pencil className="size-4" />
                        </Button>
                    )}
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
    const [visibilityProcessing, setVisibilityProcessing] = useState(false);
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

    const toggleBracketVisibility = (visible: boolean) => {
        setVisibilityProcessing(true);
        router.patch(
            updateBracketVisibility(session).url,
            { visible },
            {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => setVisibilityProcessing(false),
            },
        );
    };

    return (
        <>
            <Head title={`Manage ${session.title}`} />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <PageHeader
                    title={session.title}
                    description={`${formatDate(session.starts_at)} · ${formatTime(session.starts_at)}${session.ends_at ? ` – ${formatTime(session.ends_at)}` : ''}`}
                />

                <div className="grid w-full gap-6">
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

                    <Card className="min-w-0">
                        <CardHeader className="flex flex-row items-start justify-between gap-4">
                            <div>
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
                            </div>

                            <div className="flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 py-1.5 pr-3 pl-2.5">
                                {session.bracket_visible ? (
                                    <Eye className="text-brand-navy size-4" />
                                ) : (
                                    <EyeOff className="text-muted-foreground size-4" />
                                )}
                                <Label htmlFor="bracket-visible" className="cursor-pointer text-sm">
                                    Visible to players
                                </Label>
                                <Switch
                                    id="bracket-visible"
                                    checked={session.bracket_visible}
                                    onCheckedChange={toggleBracketVisibility}
                                    disabled={visibilityProcessing}
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="min-w-0 space-y-6">
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
                                                            registrations={registrations}
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
                                                            <TableHead>Next opponent</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {standings.map((standing) => {
                                                            const nextMatch = matches
                                                                .filter((m) => isEntryInMatch(m, standing.registrationId))
                                                                .find((m) => m.status !== 'completed');

                                                            return (
                                                                <TableRow key={standing.registrationId}>
                                                                    <TableCell>{standing.label}</TableCell>
                                                                    <TableCell>{standing.played}</TableCell>
                                                                    <TableCell>{standing.wins}</TableCell>
                                                                    <TableCell>{standing.losses}</TableCell>
                                                                    <TableCell>
                                                                        {!nextMatch ? (
                                                                            <span className="text-muted-foreground text-xs">
                                                                                No matches left
                                                                            </span>
                                                                        ) : (
                                                                            <div>
                                                                                <p className="text-sm">
                                                                                    {nextMatch.entry1_id === standing.registrationId
                                                                                        ? bracketSlotLabel(nextMatch, 'entry2')
                                                                                        : bracketSlotLabel(nextMatch, 'entry1')}
                                                                                </p>
                                                                                <p className="text-muted-foreground text-xs">
                                                                                    {matchRoundLabel(nextMatch, matches)}
                                                                                </p>
                                                                            </div>
                                                                        )}
                                                                    </TableCell>
                                                                </TableRow>
                                                            );
                                                        })}
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
                                            <Button type="button" variant="outline" asChild>
                                                <Link href={bracketFull(session)} target="_blank">
                                                    <Maximize2 className="size-4" />
                                                    View full bracket
                                                </Link>
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
                                            <BracketTree
                                                matches={matches}
                                                totalRounds={totalRounds}
                                                registrations={registrations}
                                            />
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
                                        <DoubleEliminationBracket matches={matches} registrations={registrations} />
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
                                                        <MatchRow
                                                            key={match.id}
                                                            match={match}
                                                            registrations={registrations}
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
                                                            <TableHead>Next opponent</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {standings.map((standing) => {
                                                            const nextMatch = matches
                                                                .filter((m) => isEntryInMatch(m, standing.registrationId))
                                                                .find((m) => m.status !== 'completed');

                                                            return (
                                                                <TableRow key={standing.registrationId}>
                                                                    <TableCell>{standing.label}</TableCell>
                                                                    <TableCell>{standing.played}</TableCell>
                                                                    <TableCell>{standing.wins}</TableCell>
                                                                    <TableCell>{standing.losses}</TableCell>
                                                                    <TableCell>
                                                                        {!nextMatch ? (
                                                                            <span className="text-muted-foreground text-xs">
                                                                                No matches left
                                                                            </span>
                                                                        ) : (
                                                                            <div>
                                                                                <p className="text-sm">
                                                                                    {nextMatch.entry1_id === standing.registrationId
                                                                                        ? bracketSlotLabel(nextMatch, 'entry2')
                                                                                        : bracketSlotLabel(nextMatch, 'entry1')}
                                                                                </p>
                                                                                <p className="text-muted-foreground text-xs">
                                                                                    {matchRoundLabel(nextMatch, matches)}
                                                                                </p>
                                                                            </div>
                                                                        )}
                                                                    </TableCell>
                                                                </TableRow>
                                                            );
                                                        })}
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
