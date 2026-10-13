import { ChevronsUpDown } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { search as searchPlayers } from '@/routes/open-play/players';
import type { Player } from '@/types/booking';

type Props = {
    onSelect: (player: Player) => void;
    excludeIds?: number[];
    placeholder?: string;
};

/**
 * Type-ahead player picker: type part of a name and every matching player
 * pops up in a list to choose from.
 */
export function PlayerCombobox({ onSelect, excludeIds = [], placeholder = 'Search a player…' }: Props) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Player[]>([]);
    const [loading, setLoading] = useState(false);

    const trimmed = query.trim();

    useEffect(() => {
        if (trimmed.length < 2) {
            setResults([]);
            setLoading(false);

            return;
        }

        setLoading(true);

        const handle = window.setTimeout(() => {
            fetch(searchPlayers.url({ query: { q: trimmed } }), {
                headers: { Accept: 'application/json' },
            })
                .then((r) => (r.ok ? r.json() : []))
                .then((players: Player[]) => setResults(players))
                .catch(() => setResults([]))
                .finally(() => setLoading(false));
        }, 250);

        return () => window.clearTimeout(handle);
    }, [trimmed]);

    const visible = results.filter((player) => !excludeIds.includes(player.id));

    return (
        <Popover
            open={open}
            onOpenChange={(next) => {
                setOpen(next);

                if (!next) {
                    setQuery('');
                }
            }}
        >
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="text-muted-foreground w-full justify-between font-normal"
                >
                    {placeholder}
                    <ChevronsUpDown className="size-4 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Type a name (2+ letters)…"
                        value={query}
                        onValueChange={setQuery}
                    />
                    <CommandList>
                        {trimmed.length < 2 ? (
                            <p className="text-muted-foreground py-6 text-center text-sm">
                                Type at least 2 letters to search.
                            </p>
                        ) : loading ? (
                            <p className="text-muted-foreground py-6 text-center text-sm">Searching…</p>
                        ) : (
                            <>
                                <CommandEmpty>No players found.</CommandEmpty>
                                <CommandGroup>
                                    {visible.map((player) => (
                                        <CommandItem
                                            key={player.id}
                                            value={String(player.id)}
                                            onSelect={() => {
                                                onSelect(player);
                                                setOpen(false);
                                                setQuery('');
                                            }}
                                        >
                                            {player.user?.name ?? `Player #${player.id}`}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
