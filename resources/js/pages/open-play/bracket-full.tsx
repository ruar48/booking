import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Trophy } from 'lucide-react';

import { BracketTree, DoubleEliminationBracket } from '@/components/open-play-editable-bracket';
import { entryLabel } from '@/lib/open-play';
import { index as openPlayIndex, manage } from '@/routes/open-play';
import type { OpenPlaySession } from '@/types/booking';

type Props = {
    session: OpenPlaySession;
};

export default function OpenPlayBracketFull({ session }: Props) {
    const registrations = session.registrations ?? [];
    const matches = session.matches ?? [];
    const totalRounds = matches.length > 0 ? Math.max(...matches.map((m) => m.round)) : 0;
    const finalMatch = matches.find((m) => m.round === totalRounds);
    const champion =
        session.bracket_format === 'single_elimination' && finalMatch?.status === 'completed'
            ? (finalMatch.winner ?? null)
            : null;

    return (
        <>
            <Head title={`${session.title} — Bracket`} />
            <div className="min-h-screen bg-slate-50 p-6">
                <div className="mb-6 flex items-center justify-between gap-4">
                    <div>
                        <Link
                            href={manage(session)}
                            className="text-muted-foreground mb-1 inline-flex items-center gap-1 text-sm hover:underline"
                        >
                            <ArrowLeft className="size-4" />
                            Back to manage
                        </Link>
                        <h1 className="text-2xl font-bold">{session.title} — Bracket</h1>
                    </div>
                </div>

                {session.bracket_format === 'double_elimination' ? (
                    <DoubleEliminationBracket matches={matches} registrations={registrations} />
                ) : (
                    <>
                        <BracketTree
                            matches={matches}
                            totalRounds={totalRounds}
                            registrations={registrations}
                        />
                        {champion && (
                            <div className="mt-6 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
                                <Trophy className="size-5" />
                                <span className="font-semibold">Champion: {entryLabel(champion)}</span>
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    );
}

OpenPlayBracketFull.layout = {
    breadcrumbs: [
        { title: 'Open play', href: openPlayIndex() },
        { title: 'Bracket', href: openPlayIndex() },
    ],
};
