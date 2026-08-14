import { Head, Link, router } from '@inertiajs/react';
import { CalendarDays, CheckCircle2, Clock, MapPin, TriangleAlert, Users } from 'lucide-react';
import { useState } from 'react';

import { ReadOnlyBracketTree, ReadOnlyDoubleEliminationBracket } from '@/components/open-play-bracket';
import { OpenPlayRoster } from '@/components/open-play-roster';
import { PlayerSearchInput } from '@/components/player-search-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { formatCurrency, formatDate, formatTime } from '@/lib/format';
import { edit as editProfile } from '@/routes/profile';
<<<<<<< Updated upstream
import { browse as openPlayBrowse, checkout as openPlayCheckout } from '@/routes/open-play';
=======
>>>>>>> Stashed changes
import { store as joinStore } from '@/routes/open-play/join';
import type { OpenPlaySession, Player } from '@/types/booking';

type Props = {
    session: OpenPlaySession;
    registrationsCount: number;
    isRegistered: boolean;
    paymentPending: boolean;
    isFull: boolean;
    needsProfile: boolean;
<<<<<<< Updated upstream
    myRegistrationId: number | null;
=======
>>>>>>> Stashed changes
};

function formatSkillLevel(level?: string): string {
    if (!level || level === 'all_levels') {
        return 'All levels';
    }

    return level.charAt(0).toUpperCase() + level.slice(1);
}

<<<<<<< Updated upstream
function formatBracketFormat(format?: string | null): string | null {
    switch (format) {
        case 'single_elimination':
            return 'Single Elimination Bracket';
        case 'double_elimination':
            return 'Double Elimination Bracket';
        case 'round_robin':
            return 'Round Robin Tournament';
        default:
            return null;
    }
}

export default function OpenPlayJoin({
    session,
    registrationsCount,
    isRegistered,
    paymentPending,
    isFull,
    needsProfile,
    myRegistrationId,
}: Props) {
=======
export default function OpenPlayJoin({ session, registrationsCount, isRegistered, isFull, needsProfile }: Props) {
>>>>>>> Stashed changes
    const isDoublesSession = session.team_size === 'doubles';
    const requiresPayment = session.price_per_player != null && Number(session.price_per_player) > 0;

    const [partnerMode, setPartnerMode] = useState<'select' | 'random'>('select');
    const [partner, setPartner] = useState<Player | null>(null);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const needsPartnerSelection = isDoublesSession && partnerMode === 'select';

    const matches = session.matches ?? [];
    const isSingleElim = session.bracket_format === 'single_elimination';
    const isDoubleElim = session.bracket_format === 'double_elimination';
    const hasBracketTree = isSingleElim || isDoubleElim;
    const totalRounds = matches.length > 0 ? Math.max(...matches.map((m) => m.round)) : 0;
    const isSessionComplete = matches.length > 0 && matches.every((m) => m.status === 'completed');
    const bracketFormatLabel = formatBracketFormat(session.bracket_format);

    const spotsLeft = session.max_players != null ? Math.max(session.max_players - registrationsCount, 0) : null;
    const fillPct =
        session.max_players != null && session.max_players > 0
            ? Math.min(Math.round((registrationsCount / session.max_players) * 100), 100)
            : null;

    const register = () => {
        if (needsPartnerSelection && !partner) {
            return;
        }

        setProcessing(true);
        setError(null);

        // The controller redirects back to this same page with fresh props
        // (isRegistered/registrationsCount/isFull) for free sessions, or to
        // the payment checkout page when the session charges a fee — so
        // there's no need to guess the outcome client-side, including for
        // the "already registered" / "session full" rejection paths, which
        // are also plain redirects rather than HTTP errors. Omitting
        // partner_player_id (random mode) tells the server to pair with
        // another random sign-up, or wait solo until someone else does.
        router.post(
            joinStore(session).url,
            { partner_player_id: needsPartnerSelection ? partner?.id : null },
            {
                preserveScroll: true,
                onError: (errors) => setError(Object.values(errors)[0] as string),
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <>
            <Head title={`Join ${session.title}`} />
            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="mx-auto flex w-full max-w-lg flex-col gap-4">
                    <div className="from-brand-navy relative overflow-hidden rounded-xl bg-gradient-to-br to-slate-800 p-6 text-white shadow-sm">
                        <Badge className="w-fit border-0 bg-white/15 text-white uppercase backdrop-blur-sm hover:bg-white/15">
                            Open play
                        </Badge>
                        <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{session.title}</h1>
                        {session.description && (
                            <p className="mt-1 text-sm text-white/70">{session.description}</p>
                        )}
                        <div className="mt-4 flex flex-wrap items-center gap-2">
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

                    <Card>
                        <CardContent className="space-y-4 pt-6">
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="outline">{formatSkillLevel(session.skill_level)}</Badge>
                                <Badge variant="outline">{isDoublesSession ? '2v2 Doubles' : '1v1 Singles'}</Badge>
                                {session.price_per_player != null && (
                                    <Badge variant="outline">
                                        {formatCurrency(session.price_per_player)} / player
                                    </Badge>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-1.5 font-medium text-slate-700">
                                        <Users className="text-brand-court size-4" />
                                        {session.max_players
                                            ? `${registrationsCount} / ${session.max_players} registered`
                                            : `${registrationsCount} registered`}
                                    </span>
                                    {spotsLeft !== null && (
                                        <span className="text-muted-foreground text-xs">
                                            {spotsLeft} spot{spotsLeft === 1 ? '' : 's'} left
                                        </span>
                                    )}
                                </div>
                                {fillPct !== null && (
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                        <div
                                            className="from-brand-lime h-full rounded-full bg-gradient-to-r to-emerald-500 transition-all"
                                            style={{ width: `${fillPct}%` }}
                                        />
                                    </div>
                                )}
                            </div>

                            {session.registration_closes_at && !session.is_registration_closed && (
                                <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                                    <Clock className="size-3.5 shrink-0" />
                                    Registration closes {formatDate(session.registration_closes_at)}{' '}
                                    {formatTime(session.registration_closes_at)}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Who&apos;s joined</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <OpenPlayRoster
                                registrations={session.registrations ?? []}
                                maxPlayers={session.max_players}
                                myRegistrationId={myRegistrationId ?? undefined}
                            />
                        </CardContent>
                    </Card>

                    {matches.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Bracket</CardTitle>
                                {bracketFormatLabel && (
                                    <p className="text-muted-foreground text-xs">{bracketFormatLabel}</p>
                                )}
                            </CardHeader>
                            <CardContent className="overflow-x-auto">
                                {hasBracketTree ? (
                                    isDoubleElim ? (
                                        <ReadOnlyDoubleEliminationBracket
                                            matches={matches}
                                            registrationId={myRegistrationId ?? undefined}
                                        />
                                    ) : (
                                        <ReadOnlyBracketTree
                                            matches={matches}
                                            totalRounds={totalRounds}
                                            registrationId={myRegistrationId ?? undefined}
                                        />
                                    )
                                ) : (
                                    <p className="text-muted-foreground text-sm">
                                        This is a round robin session — check the roster above for who&apos;s
                                        playing.
                                    </p>
                                )}
                                {isSessionComplete && (
                                    <p className="mt-3 text-center text-xs font-medium text-slate-500">
                                        This session has wrapped up.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {isRegistered ? (
                        <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
                            <CheckCircle2 className="size-5 shrink-0" />
                            <span className="font-semibold">
                                You&apos;re registered for this session — see you on the court!
                            </span>
                        </div>
<<<<<<< Updated upstream
                    ) : paymentPending ? (
                        <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
                            <div className="flex items-center gap-3">
                                <TriangleAlert className="size-5 shrink-0" />
                                <span className="font-semibold">
                                    You have a registration awaiting payment for this session.
                                </span>
                            </div>
                            <Button asChild size="sm" className="bg-brand-lime font-bold text-brand-navy hover:bg-brand-lime-dark">
                                <Link href={openPlayCheckout(session)}>Resume payment</Link>
                            </Button>
                        </div>
=======
>>>>>>> Stashed changes
                    ) : needsProfile ? (
                        <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
                            <div className="flex items-center gap-3">
                                <TriangleAlert className="size-5 shrink-0" />
                                <span className="font-semibold">
                                    Add your birthdate to your profile before joining Open Play.
                                </span>
                            </div>
                            <Button asChild size="sm" variant="outline">
                                <Link href={editProfile()}>Complete your profile</Link>
                            </Button>
                        </div>
                    ) : isFull ? (
                        <div className="rounded-lg border border-slate-200 bg-slate-100 p-4 text-center text-sm font-medium text-slate-500">
                            This session is full.
                        </div>
                    ) : session.is_registration_closed ? (
                        <div className="rounded-lg border border-slate-200 bg-slate-100 p-4 text-center text-sm font-medium text-slate-500">
                            Registration for this session has closed.
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="space-y-3 pt-6">
                                {isDoublesSession && (
                                    <div className="space-y-2">
                                        <ToggleGroup
                                            type="single"
                                            variant="outline"
                                            className="w-full"
                                            value={partnerMode}
                                            onValueChange={(value) => {
                                                if (!value) {
                                                    return;
                                                }
                                                setPartnerMode(value as 'select' | 'random');
                                                setPartner(null);
                                            }}
                                        >
                                            <ToggleGroupItem value="select" className="flex-1">
                                                I have a partner
                                            </ToggleGroupItem>
                                            <ToggleGroupItem value="random" className="flex-1">
                                                Pair me randomly
                                            </ToggleGroupItem>
                                        </ToggleGroup>

                                        {partnerMode === 'select' ? (
                                            <PlayerSearchInput
                                                label="Your doubles partner"
                                                selected={partner}
                                                onSelect={setPartner}
                                                onClear={() => setPartner(null)}
                                                placeholder="Search for your partner by name..."
                                            />
                                        ) : (
                                            <p className="text-muted-foreground text-xs">
                                                We&apos;ll match you with another player who also chose a
                                                random partner. You&apos;ll show as awaiting a partner until
                                                then.
                                            </p>
                                        )}
                                    </div>
                                )}
                                {error && <p className="text-destructive text-sm">{error}</p>}
                                <Button
                                    size="lg"
                                    className="w-full bg-brand-lime font-bold text-brand-navy hover:bg-brand-lime-dark"
                                    onClick={register}
                                    disabled={processing || (needsPartnerSelection && !partner)}
                                >
                                    {requiresPayment ? 'Continue to Payment' : 'Register for this session'}
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </>
    );
}

OpenPlayJoin.layout = {
    breadcrumbs: [
        { title: 'Open play', href: openPlayBrowse() },
        { title: 'Join', href: openPlayBrowse() },
    ],
};
