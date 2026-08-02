import { Head, router } from '@inertiajs/react';
import { Laptop, Monitor, Smartphone, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { ConfirmDialog } from '@/components/confirm-dialog';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatRelative } from '@/lib/format';
import { destroy, index as sessionsIndex } from '@/routes/sessions';
import type { UserSession } from '@/types/booking';

type Props = {
    sessions: UserSession[];
};

const deviceIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    iOS: Smartphone,
    Android: Smartphone,
    Windows: Monitor,
    macOS: Laptop,
    Linux: Laptop,
};

export default function Sessions({ sessions }: Props) {
    const [revokeId, setRevokeId] = useState<string | null>(null);

    return (
        <>
            <Head title="Active sessions" />

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Active sessions"
                    description="Manage devices where you are currently logged in"
                />

                <div className="space-y-3">
                    {sessions.map((session) => {
                        const DeviceIcon =
                            deviceIcons[session.device] ?? Monitor;

                        return (
                            <Card key={session.id}>
                                <CardContent className="flex items-center justify-between gap-4 py-4">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-muted rounded-lg p-2">
                                            <DeviceIcon className="size-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-medium capitalize">
                                                    {session.device}
                                                </p>
                                                {session.is_current_device ? (
                                                    <Badge variant="secondary">
                                                        This device
                                                    </Badge>
                                                ) : null}
                                            </div>
                                            <p className="text-muted-foreground text-xs">
                                                {session.ip_address ?? 'Unknown IP'}{' '}
                                                · Active{' '}
                                                {formatRelative(session.last_active_at)}
                                            </p>
                                            {session.user_agent ? (
                                                <p className="text-muted-foreground mt-1 line-clamp-1 text-xs">
                                                    {session.user_agent}
                                                </p>
                                            ) : null}
                                        </div>
                                    </div>
                                    {!session.is_current_device ? (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setRevokeId(session.id)}
                                        >
                                            <Trash2 className="size-4" />
                                        </Button>
                                    ) : null}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>

            <ConfirmDialog
                open={revokeId !== null}
                onOpenChange={(open) => !open && setRevokeId(null)}
                title="Revoke session"
                description="This device will be signed out immediately."
                confirmLabel="Revoke"
                variant="destructive"
                onConfirm={() => {
                    if (revokeId) {
                        router.delete(destroy({ session: revokeId }).url);
                    }
                }}
            />
        </>
    );
}

Sessions.layout = {
    breadcrumbs: [{ title: 'Sessions', href: sessionsIndex() }],
};
