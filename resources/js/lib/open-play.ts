import type { ClubEventMatch, ClubEventRegistration } from '@/types/booking';

export function entryLabel(entry?: ClubEventRegistration | null): string {
    if (!entry) {
        return '—';
    }

    const primary = entry.player?.user?.name ?? `Player #${entry.player_id}`;

    if (entry.partner) {
        return `${primary} & ${entry.partner.user?.name ?? `Player #${entry.partner_player_id}`}`;
    }

    return primary;
}

export type Standing = {
    registrationId: number;
    label: string;
    wins: number;
    losses: number;
    played: number;
};

export function computeStandings(
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

export function bracketSlotLabel(match: ClubEventMatch, slot: 'entry1' | 'entry2'): string {
    const entry = match[slot];

    if (entry) {
        return entryLabel(entry);
    }

    // A completed match with an empty slot is a bye or walkover — the other
    // entrant either had no round-1 opponent (a winners-bracket bye) or had
    // no losers-bracket opponent because their sibling winners-bracket match
    // was itself a bye and produced no loser to pair them against.
    if (match.status === 'completed') {
        return 'Bye';
    }

    return 'TBD';
}

export function groupByRound(matches: ClubEventMatch[]): Map<number, ClubEventMatch[]> {
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

export function roundLabel(round: number, totalRounds: number): string {
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

export function losersRoundLabel(round: number, totalLosersRounds: number): string {
    if (round === totalLosersRounds) {
        return 'Losers Final';
    }

    return `Losers Round ${round}`;
}

export function finalMatchLabel(round: number): string {
    return round >= 2 ? 'Bracket Reset' : 'Grand Final';
}

export function matchRoundLabel(match: ClubEventMatch, matches: ClubEventMatch[]): string {
    if (match.bracket_side === 'losers') {
        const losersRounds = matches
            .filter((m) => m.bracket_side === 'losers')
            .map((m) => m.round);
        const totalLosersRounds = losersRounds.length > 0 ? Math.max(...losersRounds) : match.round;

        return losersRoundLabel(match.round, totalLosersRounds);
    }

    if (match.bracket_side === 'final') {
        return finalMatchLabel(match.round);
    }

    const relevantRounds = matches
        .filter((m) => m.bracket_side !== 'losers' && m.bracket_side !== 'final')
        .map((m) => m.round);
    const totalRounds = relevantRounds.length > 0 ? Math.max(...relevantRounds) : match.round;

    return roundLabel(match.round, totalRounds);
}

export function matchesByBracketSide(matches: ClubEventMatch[]): {
    winners: ClubEventMatch[];
    losers: ClubEventMatch[];
    final: ClubEventMatch[];
} {
    const winners: ClubEventMatch[] = [];
    const losers: ClubEventMatch[] = [];
    const final: ClubEventMatch[] = [];

    for (const match of matches) {
        if (match.bracket_side === 'losers') {
            losers.push(match);
        } else if (match.bracket_side === 'final') {
            final.push(match);
        } else {
            winners.push(match);
        }
    }

    final.sort((a, b) => a.round - b.round);

    return { winners, losers, final };
}

// Unlike the winners bracket (whose match count halves every round), the
// losers bracket alternates: a "direct" round forwards each match 1:1 into
// the next round at the same match count, then a "merge" round pairs two
// adjacent matches into one, halving the count. Slot height only needs to
// double on a merge transition — this walks the actual match counts per
// round (rather than assuming the theoretical bracket-size formula) so it
// stays correct even when some losers-round-1 slots were never created
// because both their feeding winners-bracket matches were byes.
export function losersBracketRoundHeights(matches: ClubEventMatch[]): Map<number, number> {
    const rounds = groupByRound(matches);
    const roundNumbers = [...rounds.keys()].sort((a, b) => a - b);
    const heights = new Map<number, number>();

    let multiplier = 1;
    let previousCount: number | null = null;

    for (const round of roundNumbers) {
        const count = rounds.get(round)!.length;

        if (previousCount !== null && count < previousCount) {
            multiplier *= previousCount / count;
        }

        heights.set(round, multiplier);
        previousCount = count;
    }

    return heights;
}

export function isEntryInMatch(match: ClubEventMatch, registrationId: number): boolean {
    return match.entry1_id === registrationId || match.entry2_id === registrationId;
}
