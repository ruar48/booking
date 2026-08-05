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

    if (slot === 'entry2' && match.status === 'completed') {
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

export function isEntryInMatch(match: ClubEventMatch, registrationId: number): boolean {
    return match.entry1_id === registrationId || match.entry2_id === registrationId;
}
