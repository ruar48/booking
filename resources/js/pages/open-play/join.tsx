import { Head, Link, router } from '@inertiajs/react';
import { CalendarDays, CheckCircle2, Clock, MapPin, TriangleAlert, Users } from 'lucide-react';
import { useState } from 'react';

import { BrandLogo } from '@/components/brand-logo';
import { OpenPlayRoster } from '@/components/open-play-roster';
import { PlayerSearchInput } from '@/components/player-search-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { formatCurrency, formatDate, formatTime } from '@/lib/format';
import { edit as editProfile } from '@/routes/profile';
import { checkout as openPlayCheckout } from '@/routes/open-play';
import { store as joinStore } from '@/routes/open-play/join';
import type { OpenPlaySession, Player } from '@/types/booking';

type Props = {
    session: OpenPlaySession;
    registrationsCount: number;
    isRegistered: boolean;
    paymentPending: boolean;
    isFull: boolean;
    needsProfile: boolean;
};

function formatSkillLevel(level?: string): string {
    if (!level || level === 'all_levels') {
        return 'All levels';
    }

    return level.charAt(0).toUpperCase() + level.slice(1);
}

export default function OpenPlayJoin({
    session,
    registrationsCount,
    isRegistered,
    paymentPending,
    isFull,
    needsProfile,
}: Props) {
    const isDoublesSession = session.team_size === 'doubles';
    const requiresPayment = session.price_per_player != null && Number(session.price_per_player) > 0;

    const [partnerMode, setPartnerMode] = useState<'select' | 'random'>('select');
    const [partner, setPartner] = useState<Player | null>(null);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const needsPartnerSelection = isDoublesSession && partnerMode === 'select';

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
            <div className="min-h-screen bg-slate-50">
                <header className="border-b border-slate-200 bg-brand-navy">
                    <div className="mx-auto flex h-16 max-w-lg items-center px-4">
                        <Link href="/">
                            <BrandLogo imageClassName="size-9" showName nameClassName="text-white" />
                        </Link>
                    </div>
                </header>

                <main className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-8">
                    <Card>
                        <CardHeader>
                            <Badge variant="secondary" className="w-fit uppercase">
                                Open play
                            </Badge>
                            <CardTitle className="text-2xl">{session.title}</CardTitle>
                            {session.description && (
                                <p className="text-muted-foreground text-sm">{session.description}</p>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex items-center gap-2 text-slate-700">
                                <CalendarDays className="text-brand-court size-4 shrink-0" />
                                {formatDate(session.starts_at)}
                            </div>
                            <div className="flex items-center gap-2 text-slate-700">
                                <Clock className="text-brand-court size-4 shrink-0" />
                                {formatTime(session.starts_at)}
                                {session.ends_at && ` – ${formatTime(session.ends_at)}`}
                            </div>
                            {session.location && (
                                <div className="flex items-center gap-2 text-slate-700">
                                    <MapPin className="text-brand-court size-4 shrink-0" />
                                    {session.location}
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-slate-700">
                                <Users className="text-brand-court size-4 shrink-0" />
                                {session.max_players
                                    ? `${registrationsCount} / ${session.max_players} registered`
                                    : `${registrationsCount} registered`}
                            </div>
                            {session.registration_closes_at && !session.is_registration_closed && (
                                <div className="flex items-center gap-2 text-amber-700">
                                    <Clock className="size-4 shrink-0" />
                                    Registration closes {formatDate(session.registration_closes_at)}{' '}
                                    {formatTime(session.registration_closes_at)}
                                </div>
                            )}
                            <div className="flex flex-wrap gap-2 pt-1">
                                <Badge variant="outline">{formatSkillLevel(session.skill_level)}</Badge>
                                <Badge variant="outline">{isDoublesSession ? '2v2 Doubles' : '1v1 Singles'}</Badge>
                                {session.price_per_player != null && (
                                    <Badge variant="outline">
                                        {formatCurrency(session.price_per_player)} / player
                                    </Badge>
                                )}
                            </div>
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
                            />
                        </CardContent>
                    </Card>

                    {isRegistered ? (
                        <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
                            <CheckCircle2 className="size-5 shrink-0" />
                            <span className="font-semibold">
                                You&apos;re registered for this session — see you on the court!
                            </span>
                        </div>
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
                </main>
            </div>
        </>
    );
}
