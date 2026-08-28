import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAvatarFallback } from '@/hooks/use-initials';
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
    const getAvatarFallback = useAvatarFallback();

    if (registrations.length === 0) {
        return <p className="text-muted-foreground text-sm">{emptyMessage}</p>;
    }

    return (
        <div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 md:grid-cols-4">
                {registrations.map((registration) => {
                    const user = registration.player?.user;

                    return (
                        <div key={registration.id} className="flex flex-col items-center gap-2 text-center">
                            <Avatar className="size-16 shrink-0">
                                <AvatarImage src={user?.avatar ?? undefined} alt={user?.name ?? ''} />
                                <AvatarFallback className="bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                                    {getAvatarFallback(user?.name ?? '?', registration.player?.gender)}
                                </AvatarFallback>
                            </Avatar>
                            <span className="line-clamp-2 max-w-full text-sm font-medium break-words">
                                {entryLabel(registration)}
                            </span>
                            {registration.id === myRegistrationId && (
                                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                    You
                                </Badge>
                            )}
                        </div>
                    );
                })}
            </div>
            {maxPlayers != null && registrations.length < maxPlayers && (
                <p className="text-muted-foreground pt-4 text-xs">
                    {maxPlayers - registrations.length} spot{maxPlayers - registrations.length === 1 ? '' : 's'}{' '}
                    left
                </p>
            )}
        </div>
    );
}
