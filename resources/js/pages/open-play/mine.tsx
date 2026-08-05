import { Head, Link } from '@inertiajs/react';
import {
    Award,
    CalendarDays,
    Clock,
    Flame,
    Layers,
    MapPin,
    Trophy,
    Users,
} from 'lucide-react';
import type { ComponentType, ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate, formatTime } from '@/lib/format';
import {
    bracketSlotLabel,
    computeStandings,
    entryLabel,
    groupByRound,
    isEntryInMatch,
    roundLabel,
} from '@/lib/open-play';
import { cn } from '@/lib/utils';
import { browse as openPlayBrowse } from '@/routes/open-play';
import type { ClubEvent, ClubEventMatch } from '@/types/booking';

type Props = {
    session: ClubEvent;
    registrationId: number;
};

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

function ReadOnlyMatchCard({ match, registrationId }: { match: ClubEventMatch; registrationId: number }) {
    const completed = match.status === 'completed';
    const isBye = match.entry2_id === null && completed;
    const entry1Won = completed && match.winner_registration_id === match.entry1_id;
    const entry2Won = completed && match.winner_registration_id === match.entry2_id;
    const isMine = isEntryInMatch(match, registrationId);

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
            {isBye && <p className="text-muted-foreground mt-1 text-xs">Bye — advanced automatically</p>}
            {!completed && match.entry1_id !== null && match.entry2_id !== null && (
                <p className="text-muted-foreground mt-1 text-xs">Not played yet</p>
            )}
        </div>
    );
}

function ReadOnlyBracketTree({
    matches,
    totalRounds,
    registrationId,
}: {
    matches: ClubEventMatch[];
    totalRounds: number;
    registrationId: number;
}) {
    const rounds = groupByRound(matches);
    const roundNumbers = [...rounds.keys()].sort((a, b) => a - b);

    return (
        <div className="overflow-x-auto pb-2">
            <div className="flex gap-6">
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

function rankMedal(rank: number): string {
    if (rank === 1) {
        return '🥇';
    }

    if (rank === 2) {
        return '🥈';
    }

    if (rank === 3) {
        return '🥉';
    }

    return `#${rank}`;
}

function StatCard({
    icon: Icon,
    label,
    value,
    sub,
    children,
}: {
    icon: ComponentType<{ className?: string }>;
    label: string;
    value: ReactNode;
    sub?: ReactNode;
    children?: ReactNode;
}) {
    return (
        <Card>
            <CardContent className="flex flex-col items-center gap-1 p-4 text-center">
                <Icon className="text-muted-foreground size-4" />
                <p className="text-muted-foreground text-xs">{label}</p>
                <p className="text-xl leading-tight font-bold">{value}</p>
                {sub && <p className="text-muted-foreground text-xs">{sub}</p>}
                {children}
            </CardContent>
        </Card>
    );
}

export default function OpenPlayMine({ session, registrationId }: Props) {
    const registrations = session.registrations ?? [];
    const matches = session.matches ?? [];

    const myRegistration = registrations.find((r) => r.id === registrationId);
    const myMatches = matches.filter((m) => isEntryInMatch(m, registrationId));
    const nextMatch = myMatches.find((m) => m.status !== 'completed');
    const pastMatches = myMatches.filter((m) => m.status === 'completed');

    const standings = computeStandings(registrations, matches);
    const myStandingIndex = standings.findIndex((s) => s.registrationId === registrationId);
    const myStanding = myStandingIndex >= 0 ? standings[myStandingIndex] : undefined;
    const rank = myStandingIndex >= 0 ? myStandingIndex + 1 : null;
    const winRate = myStanding && myStanding.played > 0
        ? Math.round((myStanding.wins / myStanding.played) * 100)
        : 0;

    // Trailing streak: walk completed matches from most-recently-played
    // backwards and count how many in a row share the same result.
    let streak = 0;
    let streakType: 'win' | 'loss' | null = null;

    for (let i = pastMatches.length - 1; i >= 0; i--) {
        const won = pastMatches[i].winner_registration_id === registrationId;
        const type = won ? 'win' : 'loss';

        if (streakType === null) {
            streakType = type;
        } else if (streakType !== type) {
            break;
        }

        streak += 1;
    }

    const totalRounds = matches.length > 0 ? Math.max(...matches.map((m) => m.round)) : 0;
    const finalMatch = matches.find((m) => m.round === totalRounds);
    const champion =
        session.bracket_format === 'single_elimination' && finalMatch?.status === 'completed'
            ? (finalMatch.winner ?? null)
            : null;
    const amChampion = champion?.id === registrationId;

    const isDoubles = session.team_size === 'doubles';
    const isSingleElim = session.bracket_format === 'single_elimination';

    const progressPct = myMatches.length > 0
        ? Math.round((pastMatches.length / myMatches.length) * 100)
        : 0;
    const isSessionComplete = matches.length > 0 && matches.every((m) => m.status === 'completed');
    const statusLabel = matches.length === 0
        ? 'Awaiting bracket'
        : isSessionComplete
          ? 'Completed'
          : 'Active tournament';

    return (
        <>
            <Head title={`My open play — ${session.title}`} />
            <div className="flex flex-1 flex-col gap-6 p-4">
                {/* Hero */}
                <div className="from-brand-navy relative overflow-hidden rounded-xl bg-gradient-to-br to-slate-800 p-6 text-white">
                    <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span
                                    className={cn(
                                        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
                                        isSessionComplete
                                            ? 'bg-sky-400/20 text-sky-200'
                                            : matches.length === 0
                                              ? 'bg-slate-400/20 text-slate-200'
                                              : 'bg-brand-lime/20 text-brand-lime',
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'size-1.5 rounded-full',
                                            isSessionComplete
                                                ? 'bg-sky-300'
                                                : matches.length === 0
                                                  ? 'bg-slate-300'
                                                  : 'bg-brand-lime animate-pulse',
                                        )}
                                    />
                                    {statusLabel}
                                </span>
                            </div>
                            <h1 className="text-2xl font-bold sm:text-3xl">🏓 {session.title}</h1>
                            <p className="text-sm text-white/70">
                                {isSingleElim ? 'Single Elimination Bracket' : 'Round Robin Tournament'}
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
                        <Button variant="secondary" asChild className="shrink-0">
                            <Link href={openPlayBrowse()}>Back to Open play</Link>
                        </Button>
                    </div>
                </div>

                {amChampion && (
                    <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
                        <Trophy className="size-6 shrink-0" />
                        <span className="font-semibold">You won this session — congratulations, champion!</span>
                    </div>
                )}

                {/* Quick stats */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        icon={Users}
                        label="Team"
                        value={myRegistration ? entryLabel(myRegistration) : '—'}
                        sub={isDoubles ? '2v2 Doubles' : '1v1 Singles'}
                    />
                    <StatCard
                        icon={Trophy}
                        label="Win rate"
                        value={`${winRate}%`}
                        sub={myStanding ? `${myStanding.wins}W – ${myStanding.losses}L` : '0W – 0L'}
                    >
                        <div className="mt-2 flex h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                            {myStanding && myStanding.played > 0 ? (
                                <>
                                    <div
                                        className="h-full bg-emerald-500"
                                        style={{
                                            width: `${(myStanding.wins / myStanding.played) * 100}%`,
                                        }}
                                    />
                                    <div
                                        className="h-full bg-red-400"
                                        style={{
                                            width: `${(myStanding.losses / myStanding.played) * 100}%`,
                                        }}
                                    />
                                </>
                            ) : (
                                <div className="h-full w-full bg-slate-100" />
                            )}
                        </div>
                        {streak >= 2 && streakType === 'win' && (
                            <p className="mt-2 flex items-center gap-1 text-xs font-medium text-orange-600">
                                <Flame className="size-3.5" />
                                {streak} win streak
                            </p>
                        )}
                    </StatCard>
                    <StatCard
                        icon={Award}
                        label="Rank"
                        value={rank ? rankMedal(rank) : '—'}
                        sub={standings.length > 0 ? `of ${standings.length} entries` : undefined}
                    />
                    <StatCard
                        icon={Layers}
                        label="Format"
                        value={isSingleElim ? 'Single Elim' : 'Round Robin'}
                        sub={session.target_score ? `First to ${session.target_score}` : undefined}
                    />
                </div>

                {/* Progress */}
                <Card>
                    <CardContent className="space-y-2 p-4">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">Tournament progress</span>
                            <span className="text-muted-foreground">
                                {pastMatches.length} / {myMatches.length} matches complete
                            </span>
                        </div>
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                                className="from-brand-lime h-full rounded-full bg-gradient-to-r to-emerald-500 transition-all"
                                style={{ width: `${progressPct}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Next match */}
                <Card>
                    <CardHeader>
                        <CardTitle>Your next match</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {matches.length === 0 ? (
                            <p className="text-muted-foreground text-sm">
                                The bracket hasn&apos;t been generated yet — check back once the
                                organizer sets the matchups.
                            </p>
                        ) : !nextMatch ? (
                            <div className="flex flex-col items-center gap-2 py-6 text-center">
                                <Trophy className="text-brand-lime size-8" />
                                <p className="font-semibold">You&apos;re all caught up!</p>
                                <p className="text-muted-foreground text-sm">
                                    You&apos;ve completed every scheduled match. See final standings
                                    below.
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
                                <div>
                                    <p className="text-xs font-medium text-blue-700">
                                        {roundLabel(nextMatch.round, totalRounds)}
                                    </p>
                                    <p className="font-semibold text-blue-950">
                                        vs{' '}
                                        {nextMatch.entry1_id === registrationId
                                            ? bracketSlotLabel(nextMatch, 'entry2')
                                            : bracketSlotLabel(nextMatch, 'entry1')}
                                    </p>
                                </div>
                                <Badge variant="outline" className="border-blue-300 bg-white text-blue-700">
                                    Upcoming
                                </Badge>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {isSingleElim && matches.length > 0 ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>Bracket</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ReadOnlyBracketTree
                                matches={matches}
                                totalRounds={totalRounds}
                                registrationId={registrationId}
                            />
                        </CardContent>
                    </Card>
                ) : null}

                {/* Standings */}
                {!isSingleElim && standings.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Standings</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y">
                                {standings.map((standing, index) => {
                                    const isMe = standing.registrationId === registrationId;
                                    const position = index + 1;

                                    return (
                                        <div
                                            key={standing.registrationId}
                                            className={cn(
                                                'flex items-center gap-3 px-4 py-3',
                                                isMe && 'bg-blue-50',
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    'flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                                                    position === 1 && 'bg-amber-100 text-amber-700',
                                                    position === 2 && 'bg-slate-200 text-slate-700',
                                                    position === 3 && 'bg-orange-100 text-orange-700',
                                                    position > 3 && 'bg-slate-100 text-slate-500',
                                                )}
                                            >
                                                {position <= 3 ? rankMedal(position) : position}
                                            </span>
                                            <div className="flex-1">
                                                <p className="flex items-center gap-2 text-sm font-medium">
                                                    {standing.label}
                                                    {isMe && (
                                                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                                            You
                                                        </Badge>
                                                    )}
                                                </p>
                                                <p className="text-muted-foreground text-xs">
                                                    {standing.played} played
                                                </p>
                                            </div>
                                            <span className="text-sm font-semibold">
                                                <span className="text-emerald-600">{standing.wins}W</span>
                                                {' – '}
                                                <span className="text-red-500">{standing.losses}L</span>
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Match history */}
                <Card>
                    <CardHeader>
                        <CardTitle>Your match history</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {myMatches.length === 0 ? (
                            <p className="text-muted-foreground text-sm">No matches yet.</p>
                        ) : (
                            <div className="grid gap-3 sm:grid-cols-2">
                                {myMatches.map((match) => {
                                    const amEntry1 = match.entry1_id === registrationId;
                                    const myScore = amEntry1 ? match.entry1_score : match.entry2_score;
                                    const opponentScore = amEntry1
                                        ? match.entry2_score
                                        : match.entry1_score;
                                    const won =
                                        match.status === 'completed' &&
                                        match.winner_registration_id === registrationId;
                                    const lost =
                                        match.status === 'completed' &&
                                        match.winner_registration_id !== null &&
                                        match.winner_registration_id !== registrationId;

                                    return (
                                        <div
                                            key={match.id}
                                            className={cn(
                                                'flex items-center gap-3 rounded-lg border-l-4 bg-white p-3 shadow-sm',
                                                won && 'border-emerald-500',
                                                lost && 'border-red-400',
                                                !won && !lost && 'border-slate-300',
                                            )}
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    {won && (
                                                        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                                                            🏆 WIN
                                                        </Badge>
                                                    )}
                                                    {lost && (
                                                        <Badge variant="outline" className="text-red-600">
                                                            LOSS
                                                        </Badge>
                                                    )}
                                                    {!won && !lost && (
                                                        <Badge variant="outline">Upcoming</Badge>
                                                    )}
                                                    <span className="text-muted-foreground text-xs">
                                                        {roundLabel(match.round, totalRounds)}
                                                    </span>
                                                </div>
                                                <p className="mt-1 text-sm font-medium">
                                                    vs{' '}
                                                    {amEntry1
                                                        ? bracketSlotLabel(match, 'entry2')
                                                        : bracketSlotLabel(match, 'entry1')}
                                                </p>
                                            </div>
                                            <div className="text-lg font-bold">
                                                {myScore !== null && opponentScore !== null
                                                    ? `${myScore} – ${opponentScore}`
                                                    : '—'}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

OpenPlayMine.layout = {
    breadcrumbs: [
        { title: 'Open play', href: openPlayBrowse() },
        { title: 'My bracket', href: openPlayBrowse() },
    ],
};
