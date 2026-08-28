import { Head, Link } from '@inertiajs/react';
import { CalendarDays, Clock, MapPin, Trophy } from 'lucide-react';

import {
    ReadOnlyBracketTree,
    ReadOnlyDoubleEliminationBracket,
} from '@/components/open-play-bracket';
import { OpenPlayRoster } from '@/components/open-play-roster';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate, formatTime } from '@/lib/format';
import { computeStandings } from '@/lib/open-play';
import { cn } from '@/lib/utils';
import { browse as openPlayBrowse, join as openPlayJoin } from '@/routes/open-play';
import type { OpenPlaySession } from '@/types/booking';

type Props = {
    session: OpenPlaySession;
};

function formatBracketFormat(format?: string | null): string {
    switch (format) {
        case 'single_elimination':
            return 'Single Elimination Bracket';
        case 'double_elimination':
            return 'Double Elimination Bracket';
        case 'round_robin':
            return 'Round Robin Tournament';
        default:
            return 'Format not set yet';
    }
}

function rankMedal(rank: number): string {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
}

export default function OpenPlayShow({ session }: Props) {
    const registrations = session.registrations ?? [];
    const matches = session.matches ?? [];

    const isSingleElim = session.bracket_format === 'single_elimination';
    const isDoubleElim = session.bracket_format === 'double_elimination';
    const hasBracketTree = isSingleElim || isDoubleElim;

    const totalRounds = matches.length > 0 ? Math.max(...matches.map((m) => m.round)) : 0;
    const standings = computeStandings(registrations, matches);
    const isSessionComplete = matches.length > 0 && matches.every((m) => m.status === 'completed');

    return (
        <>
            <Head title={`Open play — ${session.title}`} />
            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex w-full flex-col gap-4">
                    <div className="from-brand-navy relative overflow-hidden rounded-xl bg-gradient-to-br to-slate-800 p-6 text-white">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="space-y-2">
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
                                    {isSessionComplete
                                        ? 'Completed'
                                        : matches.length === 0
                                          ? 'Awaiting bracket'
                                          : 'Active tournament'}
                                </span>
                                <h1 className="text-2xl font-bold sm:text-3xl">🏓 {session.title}</h1>
                                <p className="text-sm text-white/70">{formatBracketFormat(session.bracket_format)}</p>
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
                            {!isSessionComplete && (
                                <Button
                                    asChild
                                    className="bg-brand-lime shrink-0 font-bold text-brand-navy hover:bg-brand-lime-dark"
                                >
                                    <Link href={openPlayJoin(session)}>Join / Pay</Link>
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Who's joined */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Who&apos;s joined</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <OpenPlayRoster registrations={registrations} maxPlayers={session.max_players} />
                        </CardContent>
                    </Card>

                    {/* Bracket */}
                    {matches.length === 0 ? (
                        <Card>
                            <CardHeader>
                                <CardTitle>Bracket</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground text-sm">
                                    The bracket hasn&apos;t been generated yet — check back once the
                                    organizer sets the matchups.
                                </p>
                            </CardContent>
                        </Card>
                    ) : hasBracketTree ? (
                        <Card>
                            <CardHeader>
                                <CardTitle>Bracket</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isDoubleElim ? (
                                    <ReadOnlyDoubleEliminationBracket matches={matches} />
                                ) : (
                                    <ReadOnlyBracketTree matches={matches} totalRounds={totalRounds} />
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardHeader>
                                <CardTitle>Standings</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y">
                                    {standings.map((standing, index) => {
                                        const position = index + 1;

                                        return (
                                            <div
                                                key={standing.registrationId}
                                                className="flex items-center gap-3 px-4 py-3"
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
                                                    <p className="text-sm font-medium">{standing.label}</p>
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

                    {isSessionComplete && (
                        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
                            <Trophy className="size-6 shrink-0" />
                            <span className="font-semibold">This session has wrapped up — see the final results above.</span>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

OpenPlayShow.layout = {
    breadcrumbs: [
        { title: 'Open play', href: openPlayBrowse() },
        { title: 'Bracket', href: openPlayBrowse() },
    ],
};
