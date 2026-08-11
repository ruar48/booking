import { Users } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { entryLabel } from '@/lib/open-play';
import type { OpenPlayRegistration } from '@/types/booking';

type Props = {
    registrations: OpenPlayRegistration[];
    maxPlayers?: number | null;
    myRegistrationId?: number;
    emptyMessage?: string;
};

export function OpenPlayRoster({
    registrations,
    maxPlayers,
    myRegistrationId,
    emptyMessage = 'No one has joined yet — be the first!',
}: Props) {
    if (registrations.length === 0) {
        return <p className="text-muted-foreground text-sm">{emptyMessage}</p>;
    }

    return (
        <div className="divide-y">
            {registrations.map((registration) => (
                <div key={registration.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100">
                        <Users className="text-muted-foreground size-4" />
                    </span>
                    <span className="flex-1 truncate text-sm font-medium">{entryLabel(registration)}</span>
                    {registration.id === myRegistrationId && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            You
                        </Badge>
                    )}
                </div>
            ))}
            {maxPlayers != null && registrations.length < maxPlayers && (
                <p className="text-muted-foreground pt-2.5 text-xs first:pt-0">
                    {maxPlayers - registrations.length} spot{maxPlayers - registrations.length === 1 ? '' : 's'}{' '}
                    left
                </p>
            )}
        </div>
    );
}
