import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { search as searchPlayers } from '@/routes/open-play/players';
import type { Player } from '@/types/booking';

type PlayerSearchInputProps = {
    label: string;
    selected: Player | null;
    onSelect: (player: Player) => void;
    onClear: () => void;
    placeholder?: string;
    excludeIds?: number[];
};

export function PlayerSearchInput({
    label,
    selected,
    onSelect,
    onClear,
    placeholder,
    excludeIds = [],
}: PlayerSearchInputProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Player[]>([]);

    useEffect(() => {
        if (selected || query.trim().length < 2) {
            setResults([]);
            return;
        }

        const handle = window.setTimeout(() => {
            fetch(searchPlayers.url({ query: { q: query } }), {
                headers: { Accept: 'application/json' },
            })
                .then((r) => (r.ok ? r.json() : []))
                .then((players: Player[]) =>
                    setResults(players.filter((player) => !excludeIds.includes(player.id))),
                )
                .catch(() => setResults([]));
        }, 300);

        return () => window.clearTimeout(handle);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query, selected]);

    if (selected) {
        return (
            <div className="flex items-center gap-2">
                <Label className="text-muted-foreground text-xs">{label}</Label>
                <Badge variant="secondary">{selected.user?.name ?? `Player #${selected.id}`}</Badge>
                <Button type="button" variant="ghost" size="sm" onClick={onClear}>
                    Change
                </Button>
            </div>
        );
    }

    return (
        <div className="relative grid gap-1">
            <Label className="text-muted-foreground text-xs">{label}</Label>
            <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder ?? 'Search player by name...'}
            />
            {results.length > 0 && (
                <div className="absolute top-full z-10 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-md">
                    {results.map((player) => (
                        <button
                            key={player.id}
                            type="button"
                            className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                            onClick={() => {
                                onSelect(player);
                                setQuery('');
                                setResults([]);
                            }}
                        >
                            {player.user?.name ?? `Player #${player.id}`}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
