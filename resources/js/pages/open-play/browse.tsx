import { Head, Link } from '@inertiajs/react';
import { isPast, parseISO } from 'date-fns';
import { CalendarClock, CalendarDays, Clock, MapPin, Trophy, Users } from 'lucide-react';

import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatDate, formatTime } from '@/lib/format';
import { browse as openPlayBrowse, join, mine, show } from '@/routes/open-play';
import type { OpenPlaySession } from '@/types/booking';

type BrowseSession = OpenPlaySession & {
    is_registered: boolean;
    is_full: boolean;
};

type Props = {
    sessions: BrowseSession[];
};

function formatSkillLevel(level?: string): string {
    if (!level || level === 'all_levels') {
        return 'All levels';
    }

    return level.charAt(0).toUpperCase() + level.slice(1);
}

function formatBracketFormat(format?: string | null): string | null {
    switch (format) {
        case 'single_elimination':
            return 'Single elimination';
        case 'double_elimination':
            return 'Double elimination';
        case 'round_robin':
            return 'Round robin';
        default:
            return null;
    }
}

export default function OpenPlayBrowse({ sessions }: Props) {
    const upcoming = sessions.filter((session) => !isPast(parseISO(session.starts_at)));
    const past = sessions.filter((session) => isPast(parseISO(session.starts_at)));

    return (
        <>
            <Head title="Open Play" />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <PageHeader
                    title="Open play"
                    description="Join a session and track your bracket, matches, and standing."
                />

                {upcoming.length === 0 && past.length === 0 ? (
                    <Card>
                        <CardContent className="text-muted-foreground py-16 text-center text-sm">
                            No open play sessions have been scheduled yet.
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {upcoming.length > 0 && (
                            <div className="space-y-3">
                                <h2 className="text-sm font-semibold">Upcoming sessions</h2>
                                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                    {upcoming.map((session) => (
                                        <SessionCard key={session.id} session={session} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {past.length > 0 && (
                            <div className="space-y-3">
                                <h2 className="text-sm font-semibold">Past sessions</h2>
                                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                    {past.map((session) => (
                                        <SessionCard key={session.id} session={session} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    );
}

function SessionCard({ session }: { session: BrowseSession }) {
    const isDoubles = session.team_size === 'doubles';
    const bracketFormat = formatBracketFormat(session.bracket_format);

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{session.title}</CardTitle>
                    {session.is_registered && (
                        <Badge className="shrink-0 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                            Registered
                        </Badge>
                    )}
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                    <Badge variant="outline">{isDoubles ? '2v2 Doubles' : '1v1 Singles'}</Badge>
                    <Badge variant="outline">{formatSkillLevel(session.skill_level)}</Badge>
                    {bracketFormat && <Badge variant="outline">{bracketFormat}</Badge>}
                </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
                <div className="text-muted-foreground flex items-center gap-2">
                    <CalendarDays className="size-4 shrink-0" />
                    {formatDate(session.starts_at)}
                </div>
                <div className="text-muted-foreground flex items-center gap-2">
                    <Clock className="size-4 shrink-0" />
                    {formatTime(session.starts_at)}
                    {session.ends_at && ` – ${formatTime(session.ends_at)}`}
                </div>
                {session.location && (
                    <div className="text-muted-foreground flex items-center gap-2">
                        <MapPin className="size-4 shrink-0" />
                        {session.location}
                    </div>
                )}
                <div className="text-muted-foreground flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                        <Users className="size-4 shrink-0" />
                        {session.max_players
                            ? `${session.registrations_count ?? 0} / ${session.max_players} registered`
                            : `${session.registrations_count ?? 0} registered`}
                    </span>
                    {(session.registrations_count ?? 0) > 0 && (
                        <Button asChild variant="link" size="sm" className="h-auto p-0 text-xs">
                            <Link href={show(session)}>View players</Link>
                        </Button>
                    )}
                </div>
                {session.price_per_player != null && (
                    <div className="text-muted-foreground flex items-center gap-2">
                        <Trophy className="size-4 shrink-0" />
                        {formatCurrency(session.price_per_player)} / player
                    </div>
                )}
                {!session.is_registered &&
                    !session.is_full &&
                    session.registration_closes_at &&
                    !session.is_registration_closed && (
                        <div className="flex items-center gap-2 text-amber-700">
                            <Clock className="size-4 shrink-0" />
                            Registration closes {formatDate(session.registration_closes_at)}{' '}
                            {formatTime(session.registration_closes_at)}
                        </div>
                    )}

                <div className="pt-2">
                    {session.is_registered ? (
                        <Button asChild className="w-full">
                            <Link href={mine(session)}>
                                <CalendarClock className="size-4" />
                                Track my bracket
                            </Link>
                        </Button>
                    ) : session.is_full ? (
                        <Button className="w-full" disabled>
                            Session full
                        </Button>
                    ) : session.is_registration_closed ? (
                        <Button className="w-full" disabled>
                            Registration closed
                        </Button>
                    ) : (
                        <Button asChild variant="outline" className="w-full">
                            <Link href={join(session)}>Join this session</Link>
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

OpenPlayBrowse.layout = {
    breadcrumbs: [{ title: 'Open play', href: openPlayBrowse() }],
};
