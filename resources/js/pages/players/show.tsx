import { Head, Link } from '@inertiajs/react';
import { Award, Building2, Pencil, Star, Users } from 'lucide-react';

import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { StatusBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/format';
import { edit, index as playersIndex } from '@/routes/players';
import type { Player } from '@/types/booking';

type Props = {
    player: Player;
};

export default function PlayersShow({ player }: Props) {
    const name = player.user?.name ?? `Player #${player.id}`;

    return (
        <>
            <Head title={name} />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <PageHeader
                    title={name}
                    description={player.user?.email}
                    actions={
                        <Button asChild>
                            <Link href={edit(player)}>
                                <Pencil className="size-4" />
                                Edit player
                            </Link>
                        </Button>
                    }
                />

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        label="Skill rating"
                        value={player.skill_rating}
                        icon={Star}
                    />
                    <StatCard
                        label="Experience"
                        value={player.experience_level}
                        icon={Users}
                        className="capitalize"
                    />
                    <StatCard
                        label="Club"
                        value={player.club?.name ?? '—'}
                        icon={Building2}
                    />
                    <StatCard
                        label="Achievements"
                        value={player.achievements?.length ?? 0}
                        icon={Award}
                    />
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Status</span>
                                <StatusBadge
                                    status={player.is_active ? 'active' : 'inactive'}
                                />
                            </div>
                            {player.playing_hand ? (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Playing hand</span>
                                    <span className="capitalize">{player.playing_hand}</span>
                                </div>
                            ) : null}
                            {player.birthdate ? (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Birthdate</span>
                                    <span>{formatDate(player.birthdate)}</span>
                                </div>
                            ) : null}
                            {player.phone ? (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Phone</span>
                                    <span>{player.phone}</span>
                                </div>
                            ) : null}
                            {player.bio ? (
                                <p className="text-muted-foreground pt-2">{player.bio}</p>
                            ) : null}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Rankings</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {player.rankings?.length ? (
                                <ul className="space-y-2">
                                    {player.rankings.map((ranking) => (
                                        <li
                                            key={ranking.id}
                                            className="flex items-center justify-between text-sm"
                                        >
                                            <span>{ranking.club?.name}</span>
                                            <Badge variant="secondary">
                                                #{ranking.rank_position ?? '—'} ·{' '}
                                                {ranking.elo_rating} ELO
                                            </Badge>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-muted-foreground text-sm">
                                    No rankings yet
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {player.achievements?.length ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>Achievements</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="grid gap-3 sm:grid-cols-2">
                                {player.achievements.map((achievement) => (
                                    <li
                                        key={achievement.id}
                                        className="rounded-lg border p-4"
                                    >
                                        <p className="font-medium">{achievement.title}</p>
                                        {achievement.description ? (
                                            <p className="text-muted-foreground mt-1 text-sm">
                                                {achievement.description}
                                            </p>
                                        ) : null}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                ) : null}
            </div>
        </>
    );
}

PlayersShow.layout = {
    breadcrumbs: [{ title: 'Players', href: playersIndex() }],
};
