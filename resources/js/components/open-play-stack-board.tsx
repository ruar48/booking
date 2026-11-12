import { router } from '@inertiajs/react';
import { CalendarDays, CircleCheck, Clock, Layers, LogOut, MapPin, Plus, UserPlus, Users } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAvatarFallback } from '@/hooks/use-initials';
import { formatDate, formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { finish as finishCourt } from '@/routes/open-play/courts';
import { destroy as pullMyPaddle, store as stackMyPaddle } from '@/routes/open-play/my-paddle';
import {
    destroy as sitOut,
    everyone as stackEveryone,
    store as stackPlayer,
} from '@/routes/open-play/stack';
import type {
    OpenPlaySession,
    OpenPlayStackBoard as Board,
    StackCourt,
    StackPlayer,
    UnstackedPlayer,
} from '@/types/booking';

type Props = {
    session: Pick<OpenPlaySession, 'id'>;
    board: Board;
    /** Shows the controls: game done, stack, sit out. */
    staff?: boolean;
    /** Highlights the signed-in player. */
    myPlayerId?: number | null;
};

const visit = { preserveScroll: true, preserveState: true } as const;

/**
 * The live paddle-stacking board: who is on each court and who is next in
 * line. Staff run the session from it; players watch it for their turn.
 */
export function OpenPlayStackBoard({ session, board, staff = false, myPlayerId = null }: Props) {
    const [busy, setBusy] = useState<string | null>(null);

    const run = (key: string, send: (options: { onFinish: () => void }) => void) => {
        setBusy(key);
        send({ onFinish: () => setBusy(null) });
    };

    const groupSize = board.playersPerCourt;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="size-5" />
                        Courts
                    </CardTitle>
                    <CardDescription>
                        {groupSize} players per game. When a game ends, those players go to the back of the
                        stack and the next {groupSize} take the court.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {board.courts.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            {staff
                                ? 'No courts are reserved for this session. Edit the session and tick the courts to play on.'
                                : 'Courts will be shown here once the organizer sets them up.'}
                        </p>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {board.courts.map((court) => (
                                <CourtCard
                                    key={court.id}
                                    court={court}
                                    groupSize={groupSize}
                                    waitingCount={board.waiting.length}
                                    myPlayerId={myPlayerId}
                                    onFinish={
                                        staff
                                            ? () =>
                                                  run(`court-${court.id}`, (options) =>
                                                      router.post(
                                                          finishCourt([session.id, court.id]).url,
                                                          {},
                                                          { ...visit, ...options },
                                                      ),
                                                  )
                                            : undefined
                                    }
                                    finishing={busy === `court-${court.id}`}
                                />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Layers className="size-5" />
                        Paddle stack
                        <Badge variant="secondary" className="ml-1">
                            {board.waiting.length} waiting
                        </Badge>
                    </CardTitle>
                    <CardDescription>
                        Front of the line first. The first {groupSize} play on the next free court.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {board.waiting.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No paddles in the stack right now.</p>
                    ) : (
                        <ol className="divide-y rounded-lg border">
                            {board.waiting.map((player, index) => {
                                const startsGroup = index % groupSize === 0;
                                const group = Math.floor(index / groupSize) + 1;
                                const fullGroup = board.waiting.length - (group - 1) * groupSize >= groupSize;

                                return (
                                    <li key={player.id}>
                                        {startsGroup && (
                                            <p
                                                className={cn(
                                                    'bg-muted/50 px-3 py-1.5 text-xs font-semibold tracking-wide uppercase',
                                                    group === 1 ? 'text-primary' : 'text-muted-foreground',
                                                    index > 0 && 'border-t',
                                                )}
                                            >
                                                {group === 1 ? 'Next up' : `Group ${group}`}
                                                {!fullGroup &&
                                                    ` · waiting for ${groupSize - (board.waiting.length - (group - 1) * groupSize)} more`}
                                            </p>
                                        )}
                                        <PlayerRow
                                            player={player}
                                            position={index + 1}
                                            isMe={player.playerId === myPlayerId}
                                            action={
                                                staff ? (
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-muted-foreground"
                                                        disabled={busy === `out-${player.id}`}
                                                        onClick={() =>
                                                            run(`out-${player.id}`, (options) =>
                                                                router.delete(sitOut([session.id, player.id]).url, {
                                                                    ...visit,
                                                                    ...options,
                                                                }),
                                                            )
                                                        }
                                                    >
                                                        <LogOut className="size-4" />
                                                        Sit out
                                                    </Button>
                                                ) : undefined
                                            }
                                        />
                                    </li>
                                );
                            })}
                        </ol>
                    )}
                </CardContent>
            </Card>

            {staff && (
                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader className="flex flex-row items-start justify-between gap-4">
                            <div className="space-y-1.5">
                                <CardTitle className="flex items-center gap-2">
                                    <UserPlus className="size-5" />
                                    Not stacked yet
                                </CardTitle>
                                <CardDescription>Registered players who haven&apos;t checked in.</CardDescription>
                            </div>
                            <Button
                                type="button"
                                size="sm"
                                className="shrink-0"
                                disabled={busy === 'everyone' || (board.notStacked ?? []).length === 0}
                                onClick={() =>
                                    run('everyone', (options) =>
                                        router.post(stackEveryone(session.id).url, {}, { ...visit, ...options }),
                                    )
                                }
                            >
                                <Layers className="size-4" />
                                Stack all paid
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <UnstackedList
                                players={board.notStacked ?? []}
                                empty="Everyone registered is in the stack or on a court."
                                busy={busy}
                                onStack={(playerId) =>
                                    run(`stack-${playerId}`, (options) =>
                                        router.post(
                                            stackPlayer(session.id).url,
                                            { player_id: playerId },
                                            { ...visit, ...options },
                                        ),
                                    )
                                }
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <LogOut className="size-5" />
                                Sitting out
                            </CardTitle>
                            <CardDescription>On a break or gone home. Stacking them again puts them at the back.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <UnstackedList
                                players={(board.sittingOut ?? []).map((player) => ({ ...player, paid: true }))}
                                empty="Nobody is sitting out."
                                busy={busy}
                                stackLabel="Stack again"
                                onStack={(playerId) =>
                                    run(`stack-${playerId}`, (options) =>
                                        router.post(
                                            stackPlayer(session.id).url,
                                            { player_id: playerId },
                                            { ...visit, ...options },
                                        ),
                                    )
                                }
                            />
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

function CourtCard({
    court,
    groupSize,
    waitingCount,
    myPlayerId,
    onFinish,
    finishing,
}: {
    court: StackCourt;
    groupSize: number;
    waitingCount: number;
    myPlayerId: number | null;
    onFinish?: () => void;
    finishing: boolean;
}) {
    const playing = court.players.length > 0;
    const myCourt = court.players.some((player) => player.playerId === myPlayerId);

    return (
        <div
            className={cn(
                'flex flex-col rounded-xl border p-4',
                playing ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/30' : 'border-dashed',
                myCourt && 'ring-2 ring-primary',
            )}
        >
            <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold">{court.name}</h3>
                <Badge
                    variant="secondary"
                    className={cn(
                        playing && 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100',
                    )}
                >
                    {playing ? 'Playing' : 'Free'}
                </Badge>
            </div>

            {playing ? (
                <ul className="mt-3 grid flex-1 gap-2">
                    {court.players.map((player) => (
                        <li key={player.id}>
                            <PlayerChip player={player} isMe={player.playerId === myPlayerId} />
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="mt-3 flex-1 text-sm text-muted-foreground">
                    {waitingCount >= groupSize
                        ? 'Calling the next group…'
                        : `Waiting for ${groupSize - waitingCount} more ${groupSize - waitingCount === 1 ? 'paddle' : 'paddles'} in the stack.`}
                </p>
            )}

            {onFinish && playing && (
                <Button type="button" className="mt-4 w-full" onClick={onFinish} disabled={finishing}>
                    <CircleCheck className="size-4" />
                    {finishing ? 'Calling next group…' : 'Game done'}
                </Button>
            )}
        </div>
    );
}

function PlayerAvatar({ name, avatar, gender, className }: { name: string; avatar: string | null; gender: string | null; className?: string }) {
    const getAvatarFallback = useAvatarFallback();

    return (
        <Avatar className={cn('size-8 shrink-0', className)}>
            <AvatarImage src={avatar ?? undefined} alt={name} />
            <AvatarFallback className="bg-neutral-200 text-xs text-black dark:bg-neutral-700 dark:text-white">
                {getAvatarFallback(name, gender)}
            </AvatarFallback>
        </Avatar>
    );
}

function YouBadge() {
    return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
            You
        </Badge>
    );
}

function PlayerChip({ player, isMe }: { player: StackPlayer; isMe: boolean }) {
    return (
        <div className="flex items-center gap-2">
            <PlayerAvatar name={player.name} avatar={player.avatar} gender={player.gender} />
            <span className="min-w-0 truncate text-sm font-medium">{player.name}</span>
            {isMe && <YouBadge />}
        </div>
    );
}

function PlayerRow({
    player,
    position,
    isMe,
    action,
}: {
    player: StackPlayer;
    position: number;
    isMe: boolean;
    action?: ReactNode;
}) {
    return (
        <div className={cn('flex items-center gap-3 px-3 py-2', isMe && 'bg-blue-50 dark:bg-blue-950/40')}>
            <span className="w-6 shrink-0 text-right text-sm font-semibold text-muted-foreground tabular-nums">
                {position}
            </span>
            <PlayerAvatar name={player.name} avatar={player.avatar} gender={player.gender} />
            <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 truncate text-sm font-medium">
                    <span className="truncate">{player.name}</span>
                    {isMe && <YouBadge />}
                </p>
                <p className="text-xs text-muted-foreground">
                    {player.gamesPlayed} {player.gamesPlayed === 1 ? 'game' : 'games'} played
                </p>
            </div>
            {action}
        </div>
    );
}

function UnstackedList({
    players,
    empty,
    busy,
    stackLabel = 'Stack',
    onStack,
}: {
    players: UnstackedPlayer[];
    empty: string;
    busy: string | null;
    stackLabel?: string;
    onStack: (playerId: number) => void;
}) {
    if (players.length === 0) {
        return <p className="text-sm text-muted-foreground">{empty}</p>;
    }

    return (
        <ul className="divide-y rounded-lg border">
            {players.map((player) => (
                <li key={player.playerId} className="flex items-center gap-3 px-3 py-2">
                    <PlayerAvatar name={player.name} avatar={player.avatar} gender={player.gender} />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{player.name}</span>
                    {!player.paid && (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100">
                            Unpaid
                        </Badge>
                    )}
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busy === `stack-${player.playerId}`}
                        onClick={() => onStack(player.playerId)}
                    >
                        <Plus className="size-4" />
                        {stackLabel}
                    </Button>
                </li>
            ))}
        </ul>
    );
}

/**
 * Page header for a paddle-stacking session on the players' pages.
 */
export function OpenPlayStackHero({
    session,
    board,
    action,
}: {
    session: Pick<OpenPlaySession, 'title' | 'starts_at' | 'ends_at' | 'location' | 'team_size'>;
    board: Board;
    action?: ReactNode;
}) {
    const live = board.courts.some((court) => court.players.length > 0) || board.waiting.length > 0;

    return (
        <div className="relative overflow-hidden rounded-xl bg-linear-to-br from-brand-navy to-slate-800 p-6 text-white">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                    <span
                        className={cn(
                            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
                            live ? 'bg-brand-lime/20 text-brand-lime' : 'bg-slate-400/20 text-slate-200',
                        )}
                    >
                        <span className={cn('size-1.5 rounded-full', live ? 'animate-pulse bg-brand-lime' : 'bg-slate-300')} />
                        {live ? 'Courts in play' : 'Open play'}
                    </span>
                    <h1 className="text-2xl font-bold sm:text-3xl">🏓 {session.title}</h1>
                    <p className="text-sm text-white/70">
                        Paddle stacking · {session.team_size === 'doubles' ? 'Doubles' : 'Singles'},{' '}
                        {board.playersPerCourt} players per court
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs">
                            <CalendarDays className="size-3.5" />
                            {formatDate(session.starts_at)}
                        </span>
                        <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs">
                            <Clock className="size-3.5" />
                            {formatTime(session.starts_at)}
                            {session.ends_at && ` – ${formatTime(session.ends_at)}`}
                        </span>
                        {session.location && (
                            <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs">
                                <MapPin className="size-3.5" />
                                {session.location}
                            </span>
                        )}
                    </div>
                </div>
                {action}
            </div>
        </div>
    );
}

/** How paddle stacking works, for players who haven't played it before. */
export function PaddleStackingExplainer({ playersPerCourt }: { playersPerCourt: number }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <Layers className="size-4" />
                    How paddle stacking works
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
                    <li>When you arrive, stack your paddle — from this page or at the counter.</li>
                    <li>The order of the stack is the order of play.</li>
                    <li>When a court frees up, the first {playersPerCourt} in the stack take it.</li>
                    <li>After your game, your paddle goes to the back of the stack.</li>
                    <li>Need a break? Sit out, and stack again when you&apos;re ready.</li>
                </ol>
            </CardContent>
        </Card>
    );
}

/**
 * The signed-in player's place in a paddle-stacking session, with the
 * buttons to stack their paddle or sit out.
 */
export function MyPaddleCard({
    session,
    board,
    myPlayerId,
}: {
    session: Pick<OpenPlaySession, 'id' | 'ends_at'>;
    board: Board;
    myPlayerId: number | null;
}) {
    const [processing, setProcessing] = useState(false);
    const status = myStackStatus(board, myPlayerId);
    // Read once on mount: the page polls, so a session ending mid-view still updates selfStackOpen.
    const [ended] = useState(() => !!session.ends_at && new Date(session.ends_at).getTime() < Date.now());

    const send = (method: 'post' | 'delete') => {
        setProcessing(true);
        const url = method === 'post' ? stackMyPaddle(session.id).url : pullMyPaddle(session.id).url;
        const options = { ...visit, onFinish: () => setProcessing(false) };

        if (method === 'post') {
            router.post(url, {}, options);
        } else {
            router.delete(url, options);
        }
    };

    if (status.kind === 'playing') {
        return (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
                <p className="text-xs font-semibold tracking-wide uppercase opacity-80">You&apos;re up</p>
                <p className="mt-1 text-2xl font-bold">Head to {status.court}</p>
                <p className="mt-1 text-sm opacity-80">
                    When your game ends you go to the back of the stack automatically.
                </p>
            </div>
        );
    }

    if (status.kind === 'waiting') {
        return (
            <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Your paddle</p>
                    <p className="mt-1 text-2xl font-bold">#{status.position} in the stack</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {status.groupsAhead === 0
                            ? 'You are in the next group — get ready.'
                            : `${status.groupsAhead} ${status.groupsAhead === 1 ? 'group' : 'groups'} ahead of you.`}
                    </p>
                </div>
                <Button type="button" variant="outline" disabled={processing} onClick={() => send('delete')}>
                    <LogOut className="size-4" />
                    Sit out
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Your paddle</p>
                <p className="mt-1 text-xl font-bold">Not in the stack</p>
                <p className="mt-1 text-sm text-muted-foreground">
                    {board.selfStackOpen
                        ? 'At the venue? Stack your paddle to get in line for the next court.'
                        : ended
                          ? 'This session has ended.'
                          : 'You can stack your paddle from an hour before the session starts.'}
                </p>
            </div>
            {board.selfStackOpen && (
                <Button
                    type="button"
                    size="lg"
                    className="bg-brand-lime font-bold text-brand-navy hover:bg-brand-lime-dark"
                    disabled={processing}
                    onClick={() => send('post')}
                >
                    <Layers className="size-4" />
                    Stack my paddle
                </Button>
            )}
        </div>
    );
}

/**
 * Where the signed-in player stands: on a court, in line, or not stacked.
 */
export function myStackStatus(
    board: Board,
    myPlayerId: number | null,
): { kind: 'playing'; court: string } | { kind: 'waiting'; position: number; groupsAhead: number } | { kind: 'out' } {
    if (myPlayerId === null) {
        return { kind: 'out' };
    }

    const court = board.courts.find((c) => c.players.some((player) => player.playerId === myPlayerId));

    if (court) {
        return { kind: 'playing', court: court.name };
    }

    const index = board.waiting.findIndex((player) => player.playerId === myPlayerId);

    if (index >= 0) {
        return { kind: 'waiting', position: index + 1, groupsAhead: Math.floor(index / board.playersPerCourt) };
    }

    return { kind: 'out' };
}
